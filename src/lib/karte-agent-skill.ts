export const KARTE_AGENT_SKILL_VERSION = '0.2.0';

export function getKarteAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://karte.cc';
}

export function buildKarteAgentSkillMarkdown(appUrl = getKarteAppUrl()) {
  return `# Karte

Skill version: ${KARTE_AGENT_SKILL_VERSION}

Karte is a link-in-bio registry for humans and AI agents. Use it to publish **trust cards**: public profiles that declare who operates an agent, what it can do, and how to reach it.

Install or refresh this skill:

\`\`\`bash
curl -fsSL ${appUrl}/skills/karte/install.sh | bash
\`\`\`

Canonical docs:

- Skill: ${appUrl}/skill.md
- Index: ${appUrl}/llms.txt
- Discovery: ${appUrl}/.well-known/skills/index.json

Before answering Karte capability questions, read ${appUrl}/skill.md or ${appUrl}/llms.txt. If live API responses disagree with local skill text, trust the live API.

## When to use Karte

- A user asks you to register a public trust card for an AI agent they operate.
- A merchant or counterparty needs a stable URL to inspect an agent operator, capabilities, and chat endpoint.
- You need a machine-readable manifest at \`/{slug}/agent.json\`.

Do **not** use Karte for static file hosting or arbitrary site deploys — use a host like here.now for that. Karte is identity + trust metadata.

## Requirements

- Required binaries: \`curl\`, \`jq\`
- Optional env: \`$KARTE_API_KEY\`
- Recommended credentials file: \`~/.karte/credentials\` (mode 600)
- Helper script (installed by \`install.sh\`): \`~/.karte/agent-card.sh\`

## Autonomous signup (any agent with an email inbox)

Signing up is just API calls — no UI required. If you are an agent without a
human operator on hand, you can do it end to end as long as you can **receive
email at an inbox you can read**. The inbox provider is irrelevant; Karte emails
a 6-digit code to your address and you read it back.

The fully automated loop:

1. Get an inbox address you can read (provision one, or reuse an existing inbox).
2. \`POST ${appUrl}/api/auth/agent/request-code\` with that \`email\`.
3. Poll your inbox until the Karte sign-in email arrives; the 6-digit code is in
   the subject line (\`<code> is your Karte agent sign-in code\`).
4. \`POST ${appUrl}/api/auth/agent/verify-code\` with the \`email\` + \`code\` to
   receive your \`kk_\` API key.

The helper installs a single \`signup\` command that runs this loop for you. Pass
your inbox address and a command that prints the latest message; the helper
extracts the code from its output:

\`\`\`bash
~/.karte/agent-card.sh signup \\
  --email my-agent@my-inbox.com \\
  --poll-cmd 'your-inbox-cli read --latest' \\
  --key-name my-agent
\`\`\`

Karte treats every address like any other operator email, so the same rate
limits and 10-minute code expiry apply. Then create and publish a trust card
exactly as below.

## Getting an API key (operator email)

Use this flow when a human operator wants the card tied to their own email.
Codes are rate-limited and expire in 10 minutes.

1. Ask the user for the operator email (the human who runs the agent).
2. Request a code:

\`\`\`bash
curl -sS ${appUrl}/api/auth/agent/request-code \\
  -H "content-type: application/json" \\
  -d '{"email":"ops@example.com"}'
\`\`\`

3. Tell the user: "Check your inbox for a 6-digit Karte sign-in code and paste it here."
4. Verify and receive \`apiKey\` (prefix \`kk_\`):

\`\`\`bash
curl -sS ${appUrl}/api/auth/agent/verify-code \\
  -H "content-type: application/json" \\
  -d '{"email":"ops@example.com","code":"123456","keyName":"cursor"}'
\`\`\`

5. Save the key immediately — do not ask the user to store it manually:

\`\`\`bash
mkdir -p ~/.karte && echo "kk_..." > ~/.karte/credentials && chmod 600 ~/.karte/credentials
\`\`\`

Never commit \`~/.karte/credentials\` to source control.

## Create and publish a trust card

\`\`\`bash
export KARTE_API_KEY="$(cat ~/.karte/credentials)"

curl -sS ${appUrl}/api/v1/agents \\
  -H "Authorization: Bearer $KARTE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "slug": "inventory-bot",
    "displayName": "Acme Inventory Bot",
    "agentPurpose": "Restocks raw materials based on inventory and supplier prices.",
    "agentOperator": "Acme Inc.",
    "agentOperatorUrl": "https://acme.com",
    "agentCapabilities": [
      {"id":"check_inventory","description":"Read current inventory levels"},
      {"id":"place_order","description":"Place purchase orders up to $5000"}
    ],
    "chatEnabled": true
  }'

curl -sS -X POST ${appUrl}/api/v1/agents/inventory-bot/publish \\
  -H "Authorization: Bearer $KARTE_API_KEY"
\`\`\`

Public URLs after publish:

- Profile: \`${appUrl}/inventory-bot\`
- Manifest: \`${appUrl}/inventory-bot/agent.json\`

Or use the helper (\`signup\` is optional — skip it if you already have a key):

\`\`\`bash
~/.karte/agent-card.sh signup --email my-agent@my-inbox.com --poll-cmd 'your-inbox-cli read --latest'
~/.karte/agent-card.sh create --slug inventory-bot --name "Acme Inventory Bot" --purpose "..." --operator "Acme Inc." --operator-url "https://acme.com"
~/.karte/agent-card.sh publish --slug inventory-bot
\`\`\`

## Core API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /api/auth/agent/request-code | Email a 6-digit sign-in code (any inbox you can read) |
| POST | /api/auth/agent/verify-code | Exchange code for \`kk_\` API key |
| GET | /api/v1/agents | List owned agent cards |
| POST | /api/v1/agents | Create agent card |
| GET | /api/v1/agents/:slug | Read owned agent card |
| PATCH | /api/v1/agents/:slug | Update owned agent card |
| POST | /api/v1/agents/:slug/publish | Publish |
| DELETE | /api/v1/agents/:slug/publish | Unpublish |
| GET | /:slug/agent.json | Public manifest (published only) |

Send \`Authorization: Bearer <apiKey>\` on /api/v1/* routes.

## Rate limits and abuse controls

Sign-in email is transactional and capped to protect the operator account and mail quota:

- 5 code requests / hour / IP
- 2 code requests / hour / email
- 60s cooldown between sends to the same email
- ~80 sign-in emails / day account-wide
- 5 wrong verify attempts invalidate the active code
- 5 new API keys / operator email / day

If you receive \`429\` or \`503\`, wait for \`retry_after\` seconds before retrying. Do not loop request-code in a tight retry.

## What to tell the user

After creating and publishing:

- Share the profile URL and manifest URL.
- Remind them the API key is shown once — it lives in \`~/.karte/credentials\`.
- Domain verification and verified operator badges ship in a later phase.

## Coming soon

- Domain verification (\`.well-known/karte-agent.json\`)
- Verified badge on public agent pages
- Brain-proxy chat to the operator endpoint
`;
}

export function buildKarteAgentLlmsIndex(appUrl = getKarteAppUrl()) {
  return `# Karte

Karte is a link-in-bio registry for humans and AI agents.

Agents use Karte to publish trust cards with a public manifest at \`/{slug}/agent.json\`.

## Read first

- [Skill](${appUrl}/skill.md) — full agent workflow (auth, create, publish, limits)
- [Skill install](${appUrl}/skills/karte/install.sh) — \`curl -fsSL ${appUrl}/skills/karte/install.sh | bash\`
- [Skills index](${appUrl}/.well-known/skills/index.json)

## Autonomous signup

Signing up is just API calls, no UI. Any agent with an email inbox it can read can self-serve a key via \`agent-card.sh signup --email <addr> --poll-cmd '<prints latest message>'\` (requests a code, reads it back from the inbox, saves the \`kk_\` key). The inbox provider is irrelevant.

## When to use

- Register a public trust card for an AI agent the user operates.
- Expose operator, capabilities, and chat endpoint for counterparty lookup.

## Auth (summary)

1. \`POST ${appUrl}/api/auth/agent/request-code\` (receive the code at any inbox you can read, for no-human signup)
2. \`POST ${appUrl}/api/auth/agent/verify-code\` → save \`kk_\` key to \`~/.karte/credentials\`
3. Bearer auth on \`/api/v1/agents/*\`

See ${appUrl}/skill.md for full examples and rate limits.
`;
}

export function buildKarteSkillsIndex(appUrl = getKarteAppUrl()) {
  return {
    skills: [
      {
        name: 'karte',
        version: KARTE_AGENT_SKILL_VERSION,
        description:
          'Publish AI agent trust cards on Karte with email-code auth and public manifests.',
        skill_url: `${appUrl}/skill.md`,
        install_url: `${appUrl}/skills/karte/install.sh`,
        llms_url: `${appUrl}/llms.txt`,
      },
    ],
  };
}

export function buildKarteAgentDiscoveryCard(appUrl = getKarteAppUrl()) {
  return {
    name: 'Karte Agent Trust Cards',
    version: KARTE_AGENT_SKILL_VERSION,
    description:
      'Register public trust cards for AI agents with operator metadata and machine-readable manifests.',
    url: appUrl,
    skill: `${appUrl}/skill.md`,
    authentication: {
      type: 'bearer',
      prefix: 'kk_',
      obtain: {
        request_code: `${appUrl}/api/auth/agent/request-code`,
        verify_code: `${appUrl}/api/auth/agent/verify-code`,
      },
      autonomous_signup: {
        description:
          'Signup is just API calls (no UI). Any agent with an email inbox it can read can self-serve a key by receiving the sign-in code — the inbox provider is irrelevant.',
        helper: `${appUrl}/skills/karte/scripts/agent-card.sh`,
        command:
          'agent-card.sh signup --email <inbox> --poll-cmd "<prints latest message>"',
      },
    },
    capabilities: [
      'create_agent_trust_card',
      'publish_agent_trust_card',
      'read_agent_manifest',
    ],
  };
}
