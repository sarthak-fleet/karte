# Product surfaces

The full route and surface inventory. Source of truth for "what exists" —
deeper behavior lives in the per-feature docs linked from here and in code.

## Public surfaces (visitor-facing)

| Route | Surface | Notes |
| --- | --- | --- |
| `/` | Landing | Astro overlay on production build (see `docs/operations/deploy.md`). |
| `/login` | Google sign-in | better-auth Google provider. |
| `/create` | Page creation wizard | First thing a new user sees. |
| `/welcome` | Onboarding entry | |
| `/[slug]` | Public profile page (SSR) | Heavy server render; see `docs/knowledge/audits/perf-audit.md`. |
| `/[slug]/encyclopedia` | AI profile mode | `docs/product/ai-modes.md` |
| `/[slug]/roast` | AI profile mode | `docs/product/ai-modes.md` |
| `/[slug]/newspaper` | AI profile mode | `docs/product/ai-modes.md` |
| `/[slug]/data.json` | Public profile JSON | Agent-readable profile payload. |
| `/[slug]/vcard` | vCard download | |
| `/about`, `/privacy`, `/terms` | Static legal/brand | Low traffic but represent brand. |

## Public API (visitor-side)

| Route | Purpose |
| --- | --- |
| `/api/chat/[slug]` | Public streaming chat (SSE). |
| `/api/chat/[slug]/messages`, `/conversations` | Chat persistence. |
| `/api/contact/[slug]` | Public contact / DM form. |
| `/api/track/[slug]` | Analytics event tracking. |
| `/api/og` | OG image generation. |
| `/api/email/inbound` | Inbound email handoff from `karte-email` worker. |

## Dashboard (auth-gated, owner-only)

| Route | Surface |
| --- | --- |
| `/dashboard` | Hub |
| `/dashboard/links`, `/sections`, `/appearance`, `/widgets`, `/components` | Profile composition |
| `/dashboard/projects`, `/encyclopedia`, `/memory`, `/chats`, `/inbox`, `/leads` | Content + inbound |
| `/dashboard/analytics`, `/timeline`, `/experiments`, `/domains` | Insight + config |
| `/dashboard/email` | Inbound email inbox (`docs/product/email-inbox.md`) |
| `/dashboard/leads` | Lead Radar across DMs, inbound email, chat transcripts, tracked activity |
| `/dashboard/opportunities` | Creator Opportunity Desk (`docs/product/opportunity-desk.md`) |
| `/dashboard/domains` | Custom domains (`docs/product/custom-domains.md`) |

## Authenticated API (owner-side)

| Route | Purpose |
| --- | --- |
| `/api/auth/*` | better-auth handler. |
| `/api/pages/*` | CRUD: pages, links, sections, projects, domains, chat-config, conversations, timeline, enrich, revamp, generated-status. |
| `/api/pages/[pageId]/generate/{encyclopedia,roast,newspaper}` | AI generation. |
| `/api/pages/[pageId]/opportunities/*` | Owner-only opportunity lifecycle + explicit, rate-limited brief generation. |
| `/api/pages/[pageId]/emails/*` | Dashboard inbox list / read / delete. |
| `/api/uploads/images` | R2 avatar / project uploads. |
| `/api/settings/ai-key` | Per-page AI key override. |
| `/api/ai/models` | Available AI models. |
| `/api/onboarding/chat`, `/api/demo-chat`, `/api/import/preview`, `/api/agent-waitlist` | Onboarding helpers. |

## Agent surfaces

| Route | Purpose |
| --- | --- |
| `/api/v1/agents/[slug]` | Agent API v1 — read/publish for external agents. |
| `/api/auth/agent/{request-code,verify-code}` | Agent device auth. |
| `/.well-known/`, `llms.txt`, `llms-full.txt`, `/api/ai`, `robots.txt` | Agent / LLM indexing surfaces (fleet GEO standard), served at the edge by `agent-edge.mjs`. |

See `docs/architecture/edge-worker.md` for how agent edges are served before OpenNext.
