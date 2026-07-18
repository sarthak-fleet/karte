# Environment + secrets

Source of truth for required config. Never commit secrets. `.env*` is
gitignored except `.env.example`. Production secrets are set with
`wrangler secret put`.

## App (required)

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | `openssl rand -base64 32`. Startup validates non-empty. |
| `BETTER_AUTH_URL` | Yes | Deployed origin, e.g. `https://karte.cc` (set in `wrangler.jsonc` `vars`). Must match or auth redirects/callbacks fail. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client. Redirect URI: `https://karte.cc/api/auth/callback/google`. (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are accepted aliases.) |
| `TURSO_DATABASE_URL` | Yes | `libsql://...` or `file:local.db` for dev. |
| `TURSO_AUTH_TOKEN` | Turso remote | `turso db tokens create <db>`. Not needed for `file:local.db`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin used in links + emails. |
| `LINKCHAT_DEFAULT_AI_API_KEY` | Yes (chat) | Fallback AI API key for chat. |
| `RAG_SERVICE_KEY` | Yes (RAG) | Cloudflare `knowledgebase` RAG service key for profile memory. |

## App (optional)

| Variable | Purpose |
| --- | --- |
| `LINKCHAT_DEFAULT_AI_ENDPOINT_URL` | Defaults to the free-ai-gateway worker (set in `wrangler.jsonc` `vars`). |
| `LINKCHAT_DEFAULT_AI_MODEL` | Defaults to `groq/llama-3.3-70b-versatile` (set in `wrangler.jsonc` `vars`). |
| `RAG_SERVICE_URL` | Fallback public RAG URL when the `RAG_SERVICE` binding is unavailable. |

## R2 (required for image uploads)

`CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME` (`linkchat-images`),
`R2_PUBLIC_BASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

## Cloudflare Workers bindings (wrangler.jsonc, not env vars)

- `DB` → D1 `linkchat-auth`
- `IMAGES_BUCKET` → R2 `linkchat-images`
- `NEXT_INC_CACHE_R2_BUCKET` → R2 `linkchat-cache`
- `ANALYTICS` → Analytics Engine
- `EMAIL` → `send_email` binding
- `RAG_SERVICE` → `knowledgebase` worker
- `WORKER_SELF_REFERENCE` → self (ISR queue)
- `RATE_LIMITER_DO`, `NEXT_CACHE_DO_QUEUE` → Durable Objects
- `vars`: `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM_ADDRESS`,
  `EMAIL_FROM_NAME`, `AGENT_AUTH_DAILY_EMAIL_CAP`, AI endpoint + model defaults.

## Secrets set via `wrangler secret put`

`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` (custom domains),
`EMAIL_INBOUND_SECRET` (shared with the `karte-email` worker), plus all the
required app vars above when running on Workers.

## PostHog (optional, internal product analytics)

`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`. No PII or private
content is sent to PostHog — users identified by DB ID only
(`docs/product/analytics.md`).
