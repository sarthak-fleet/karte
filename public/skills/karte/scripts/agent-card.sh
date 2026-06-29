#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${KARTE_BASE_URL:-https://karte.cc}"
CREDS="${KARTE_CREDENTIALS:-${HOME}/.karte/credentials}"

die() {
  echo "error: $*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

api_key() {
  if [[ -n "${KARTE_API_KEY:-}" ]]; then
    printf '%s' "${KARTE_API_KEY}"
    return
  fi
  if [[ -f "${CREDS}" ]]; then
    tr -d ' \n\r\t' < "${CREDS}"
    return
  fi
  die "no API key found; set KARTE_API_KEY or run: $0 auth --email you@example.com --code 123456"
}

request_json() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "${body}" ]]; then
    curl -fsS -X "${method}" "${BASE_URL}${path}" \
      -H "content-type: application/json" \
      -d "${body}"
  else
    curl -fsS -X "${method}" "${BASE_URL}${path}"
  fi
}

auth_json() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local key
  key="$(api_key)"
  if [[ -n "${body}" ]]; then
    curl -fsS -X "${method}" "${BASE_URL}${path}" \
      -H "authorization: Bearer ${key}" \
      -H "content-type: application/json" \
      -d "${body}"
  else
    curl -fsS -X "${method}" "${BASE_URL}${path}" \
      -H "authorization: Bearer ${key}"
  fi
}

cmd_auth() {
  local email="" code="" key_name="cli"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --email) email="$2"; shift 2 ;;
      --code) code="$2"; shift 2 ;;
      --key-name) key_name="$2"; shift 2 ;;
      *) die "unknown arg: $1" ;;
    esac
  done
  [[ -n "${email}" && -n "${code}" ]] || die "usage: auth --email ops@example.com --code 123456 [--key-name cursor]"

  local resp api_key_value dest
  resp="$(request_json POST /api/auth/agent/verify-code "{\"email\":\"${email}\",\"code\":\"${code}\",\"keyName\":\"${key_name}\"}")"
  api_key_value="$(printf '%s' "${resp}" | jq -er '.apiKey')"
  dest="$(dirname "${CREDS}")"
  mkdir -p "${dest}"
  printf '%s' "${api_key_value}" > "${CREDS}"
  chmod 600 "${CREDS}" 2>/dev/null || true
  printf '%s\n' "${resp}" | jq '{apiKeyId, userId, email, keyName, docs_url, message}'
}

cmd_request_code() {
  local email=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --email) email="$2"; shift 2 ;;
      *) die "unknown arg: $1" ;;
    esac
  done
  [[ -n "${email}" ]] || die "usage: request-code --email ops@example.com"
  request_json POST /api/auth/agent/request-code "{\"email\":\"${email}\"}" | jq .
}

# Fully autonomous signup using an AgentMail inbox (https://agentmail.to).
# Creates an inbox, requests a Karte sign-in code, polls the inbox for the
# code, verifies it, and saves the resulting kk_ API key — no human needed.
cmd_signup() {
  local domain="" username="" display_name="" key_name="agent"
  local timeout=120 interval=3
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --domain) domain="$2"; shift 2 ;;
      --username) username="$2"; shift 2 ;;
      --display-name) display_name="$2"; shift 2 ;;
      --key-name) key_name="$2"; shift 2 ;;
      --timeout) timeout="$2"; shift 2 ;;
      --interval) interval="$2"; shift 2 ;;
      *) die "unknown arg: $1" ;;
    esac
  done
  [[ -n "${AGENTMAIL_API_KEY:-}" ]] || die "signup requires AGENTMAIL_API_KEY (create one at https://agentmail.to)"
  local am_base="${AGENTMAIL_BASE_URL:-https://api.agentmail.to}"

  # 1. Provision an inbox the agent owns.
  local inbox_body inbox inbox_id email
  inbox_body="$(jq -n \
    --arg domain "${domain}" \
    --arg username "${username}" \
    --arg displayName "${display_name}" \
    '{}
    + (if $domain != "" then {domain: $domain} else {} end)
    + (if $username != "" then {username: $username} else {} end)
    + (if $displayName != "" then {display_name: $displayName} else {} end)')"
  inbox="$(curl -fsS -X POST "${am_base}/v0/inboxes" \
    -H "authorization: Bearer ${AGENTMAIL_API_KEY}" \
    -H "content-type: application/json" \
    -d "${inbox_body}")" || die "agentmail: could not create inbox"
  inbox_id="$(printf '%s' "${inbox}" | jq -er '.inbox_id')" || die "agentmail: missing inbox_id in response"
  email="$(printf '%s' "${inbox}" | jq -er '.email')" || die "agentmail: missing email in response"
  echo "agentmail inbox ready: ${email}" >&2

  # 2. Ask Karte to email a sign-in code to the agent inbox.
  request_json POST /api/auth/agent/request-code "{\"email\":\"${email}\"}" >/dev/null \
    || die "karte: request-code failed for ${email}"
  echo "requested sign-in code; polling ${email} (timeout ${timeout}s)..." >&2

  # 3. Poll the inbox until the 6-digit code arrives.
  local code="" msgs deadline=$((SECONDS + timeout))
  while ((SECONDS < deadline)); do
    msgs="$(curl -fsS "${am_base}/v0/inboxes/${inbox_id}/messages?limit=10" \
      -H "authorization: Bearer ${AGENTMAIL_API_KEY}" 2>/dev/null)" || msgs=""
    if [[ -n "${msgs}" ]]; then
      code="$(printf '%s' "${msgs}" | jq -r '
        .messages[]?
        | select(
            (((.from // "") | ascii_downcase) | test("karte"))
            or (((.subject // "") | ascii_downcase) | test("sign-in code"))
          )
        | (.subject // "")' | grep -oE '[0-9]{6}' | head -n1 || true)"
    fi
    [[ -n "${code}" ]] && break
    sleep "${interval}"
  done
  [[ -n "${code}" ]] || die "timed out waiting for a Karte sign-in code in ${email}"
  echo "received sign-in code" >&2

  # 4. Exchange the code for a kk_ API key and persist it.
  local resp api_key_value dest
  resp="$(request_json POST /api/auth/agent/verify-code "{\"email\":\"${email}\",\"code\":\"${code}\",\"keyName\":\"${key_name}\"}")" \
    || die "karte: verify-code failed"
  api_key_value="$(printf '%s' "${resp}" | jq -er '.apiKey')" || die "karte: no apiKey in verify-code response"
  dest="$(dirname "${CREDS}")"
  mkdir -p "${dest}"
  printf '%s' "${api_key_value}" > "${CREDS}"
  chmod 600 "${CREDS}" 2>/dev/null || true
  printf '%s\n' "${resp}" | jq '{apiKeyId, userId, email, keyName, docs_url, message}'
}

cmd_create() {
  local slug="" name="" purpose="" operator="" operator_url="" payload
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --slug) slug="$2"; shift 2 ;;
      --name) name="$2"; shift 2 ;;
      --purpose) purpose="$2"; shift 2 ;;
      --operator) operator="$2"; shift 2 ;;
      --operator-url) operator_url="$2"; shift 2 ;;
      *) die "unknown arg: $1" ;;
    esac
  done
  [[ -n "${slug}" && -n "${name}" ]] || die "usage: create --slug inventory-bot --name \"Inventory Bot\" [--purpose ...] [--operator ...] [--operator-url ...]"

  payload="$(jq -n \
    --arg slug "${slug}" \
    --arg displayName "${name}" \
    --arg agentPurpose "${purpose}" \
    --arg agentOperator "${operator}" \
    --arg agentOperatorUrl "${operator_url}" \
    '{
      slug: $slug,
      displayName: $displayName,
      chatEnabled: true
    }
    + (if $agentPurpose != "" then {agentPurpose: $agentPurpose, bio: $agentPurpose} else {} end)
    + (if $agentOperator != "" then {agentOperator: $agentOperator} else {} end)
    + (if $agentOperatorUrl != "" then {agentOperatorUrl: $agentOperatorUrl} else {} end)')"

  auth_json POST /api/v1/agents "${payload}" | jq .
}

cmd_publish() {
  local slug=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --slug) slug="$2"; shift 2 ;;
      *) die "unknown arg: $1" ;;
    esac
  done
  [[ -n "${slug}" ]] || die "usage: publish --slug inventory-bot"
  auth_json POST "/api/v1/agents/${slug}/publish" | jq .
}

cmd_list() {
  auth_json GET /api/v1/agents | jq .
}

usage() {
  cat <<EOF
Karte agent trust card helper

Usage:
  $0 signup [--domain bot.example.com] [--username myagent] [--key-name agent] [--timeout 120]
  $0 request-code --email ops@example.com
  $0 auth --email ops@example.com --code 123456 [--key-name cursor]
  $0 create --slug inventory-bot --name "Inventory Bot" [--purpose ...] [--operator ...] [--operator-url ...]
  $0 publish --slug inventory-bot
  $0 list

signup is fully autonomous: it provisions an AgentMail inbox, requests a Karte
sign-in code, reads it back from the inbox, and saves the kk_ API key. No human
email or code paste required.

Environment:
  KARTE_BASE_URL        default: https://karte.cc
  KARTE_API_KEY         bearer token override
  KARTE_CREDENTIALS     default: ~/.karte/credentials
  AGENTMAIL_API_KEY     required for signup (create at https://agentmail.to)
  AGENTMAIL_BASE_URL    default: https://api.agentmail.to
EOF
}

main() {
  need curl
  need jq
  local cmd="${1:-}"
  shift || true
  case "${cmd}" in
    signup) cmd_signup "$@" ;;
    request-code) cmd_request_code "$@" ;;
    auth) cmd_auth "$@" ;;
    create) cmd_create "$@" ;;
    publish) cmd_publish "$@" ;;
    list) cmd_list "$@" ;;
    -h|--help|help|"") usage ;;
    *) die "unknown command: ${cmd}" ;;
  esac
}

main "$@"
