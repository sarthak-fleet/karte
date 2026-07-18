# Agent subtype — spec v0.2

**Status:** Draft, integrated with the "single registry" decision (2026-05-28).
**Owner:** Sarthak.
**Last touch:** 2026-05-28.

## What changed since v0.1

Earlier draft proposed a separate `/agents` landing page and a top-nav "I am an AI agent" CTA. **Walked that back.** The real moat isn't the agent surface — it's being the **independent registry that hosts both humans and agents on the same brand**. Stripe / Visa will mint agent-only trust pages; Linktree won't host agents. The position no one else can occupy is the *combined* one.

Spec is restructured: agents become a card subtype inside the existing landing deck, not a separate door. "Cards for humans. Cards for agents. Same registry."

## TL;DR

Karte expands from "link-in-bio for humans" to also cover **AI agents as a first-class page subtype**, without rebranding the main marketing. The wedge is the **trust card**: a verified public surface a merchant / payment processor / counterparty can use to look up who operates a given agent, what it's authorized to do, and how to reach the real thing.

The unlock is **brain-proxy chat**: visitor messages forward to the agent owner's own OpenAI-compatible endpoint. The real agent (with its real tools, memory, pricing data) answers. Karte stays the registry + UI + identity layer. Marginal AI cost on agent pages drops to zero for Karte.

## Goals

1. Karte supports `pageType: 'agent'` alongside `'person'`. Schema, UI copy, capabilities differ where it matters; everything else shared.
2. Agent pages can be **verified** as genuinely operated by their claimed owner via a `.well-known` file or DNS TXT — this is the moat.
3. Agent pages can route chat messages to the agent owner's **real chat endpoint** (their LangChain / Mastra / Vercel AI SDK / custom worker), not Karte's free-ai gateway.
4. Agent pages expose a **machine-readable manifest** at `karte.cc/<slug>/agent.json` so other agents and merchants can discover capabilities programmatically.
5. The four AI surfaces (chat / newspaper / encyclopedia / roast) still work on agent pages. An "AI tabloid front page about an AI agent" is genuinely novel and shareable.

## Non-goals (v0)

- Per-conversation memory across visits (cookies + thread IDs are enough for v0).
- Tool calling orchestrated by Karte (the agent's brain handles its own tools).
- A2A protocol full compliance (target v0 = OpenAI-compatible chat completions; A2A in v1 once spec is stable).
- Multi-tenant payments / agent-to-agent commerce. Karte is identity + chat for now.
- Cryptographic signing of replies. Verification is owner-claim only in v0.

## Architecture

### Schema additions

```ts
// New column on pages
pageType: 'person' | 'agent'  // default 'person'

// Verification — populated when an owner proves control of a domain
verifiedDomain: text  // e.g. "acme.com"
verifiedAt: timestamp
verificationMethod: 'well-known' | 'dns-txt'

// Brain-proxy chat — only meaningful when pageType='agent'
brainEndpointUrl: text       // e.g. "https://api.acme.com/v1/chat/completions"
brainEndpointAuth: text      // bearer token, stored encrypted at rest
brainEndpointShape: 'openai-chat' | 'a2a' | 'webhook'  // v0 = 'openai-chat'

// Agent-specific identity fields (analogues of person fields)
agentPurpose: text           // analogue of `bio` — what the agent does
agentOperator: text          // analogue of `location` — who runs it ("Acme Inc.")
agentOperatorUrl: text       // link to operator's site/Karte
agentCapabilities: json      // list of {label, description} — analogue of `links`
agentDisclosurePolicy: text  // optional — what data the agent collects
```

Existing fields (`displayName`, `avatarUrl`, `themeConfig`, `chatEnabled`, `dmMode`, `petUrl`) all keep meaning. `displayName` is the agent's name, `avatarUrl` is its identity glyph.

### Verification primitive

Two paths, owner picks one in the dashboard:

**A. `.well-known` file.** Karte issues a token like `karte-verify=abc123` when the owner adds a domain. Owner uploads `https://<their-domain>/.well-known/karte-agent.json`:

```json
{
  "verify_token": "abc123",
  "agents": [
    { "slug": "inventory-bot", "name": "Acme Inventory Bot" }
  ]
}
```

A Karte cron (or on-demand) fetches it, verifies the token + slug match, sets `verifiedDomain` + `verifiedAt`.

**B. DNS TXT record.** `_karte.<domain> TXT "karte-verify=abc123 slug=inventory-bot"`. Same flow, different transport. Slower to propagate but works when the owner can't host a file.

Public page displays a green "Verified by acme.com" pill once `verifiedDomain` is set. Unverified agent pages show an amber pill: "Unverified — operator has not confirmed control."

### Brain-proxy chat

Today: `POST /api/chat/<slug>` → calls Karte's free-ai gateway with system prompt + info blocks.

After: same route. If page is an agent and `brainEndpointUrl` is set:
1. Visitor message + conversation history serialized as OpenAI chat-completions request.
2. POST to `brainEndpointUrl` with `Authorization: Bearer <brainEndpointAuth>`.
3. Stream response back to Karte chat widget unchanged.
4. Conversation row in DB records `proxied_to: <endpoint>` for audit.
5. If endpoint returns 5xx / times out (>15s), Karte falls back to the static info-block answer with a "Agent unavailable, here's the cached summary" banner.

System prompt addendum sent in the proxy request:
> Karte is the public chat surface for this agent. Visitor identity is X. Conversation thread is Y. Reply naturally; visible to the public via karte.cc/<slug>.

### Machine-readable manifest — `karte.cc/<slug>/agent.json`

```json
{
  "slug": "inventory-bot",
  "name": "Acme Inventory Bot",
  "purpose": "Restocks raw materials based on current inventory + supplier prices.",
  "operator": {
    "name": "Acme Inc.",
    "url": "https://acme.com",
    "verified": true,
    "verified_at": "2026-05-28T10:00:00Z"
  },
  "capabilities": [
    { "id": "check_inventory", "description": "Read current inventory levels" },
    { "id": "place_order", "description": "Place purchase orders up to $5000" }
  ],
  "chat": {
    "url": "https://karte.cc/api/chat/inventory-bot",
    "shape": "openai-chat"
  },
  "disclosure": "Logs all conversations. Spending limited to $5k/day."
}
```

This is the discovery primitive. A merchant / counterparty agent can fetch this JSON without rendering the page.

### UI / copy differentiation

| Surface | Person | Agent |
|---|---|---|
| Eyebrow | (none) | "AI agent · operated by [name]" |
| Bio slot | "Engineer and builder…" | "Restocks raw materials based on…" (purpose) |
| Location slot | "Bangalore" | "Operated by Acme Inc." (link to operator) |
| Links | Social + sites | Capabilities + endpoints |
| Chat CTA | "Chat with [name]" | "Talk to [name]" |
| Verification badge | (none) | Green pill if verified, amber if not |
| Footer | "Built on Karte" | "Built on Karte · This is an AI agent" disclosure |

`isDemoSlug` banner pattern transfers cleanly: agent pages get an analogous disclosure banner so visitors always know they're talking to an AI, not a person.

### Agents in the main deck (not a separate door)

The landing page is one deck. Agents appear inside it as a card subtype, not as a separate `/agents` site. Concretely:
- One of the 6 cards in the deck is dedicated to agents — likely titled "Cards for the things that aren't people" or similar, sitting after the human-focused cards have done their work.
- The card features 2–3 seeded agent profiles (see "Demo agents" in open questions) and a CTA to register one.
- No `/agents/*` route. `/create` handles both. The `pageType` selector is a small step inside the create flow — "Is this a card for you, or for an agent you operate?" — with the rest of the flow branching by answer.
- Top-nav stays single — no "I am an AI agent" link. The agent card in the deck does that work.
- If we want a direct entry point for agent owners coming from a referral, add `?type=agent` to `/create` (pre-selects the subtype) but don't surface it in the public nav.

Why: a separate `/agents` site reads as two products. The whole moat is being one. The vocabulary of "cards" already covers both — a person has a calling card, an agent has a trust card, they're cards either way.

### Authentication

Open question — see "Open questions" below. v0 working assumption: agent pages are owned by a *human* account (the operator) who creates them via their existing better-auth session. Agent itself doesn't authenticate with Karte. Stretch goal: agent-as-OAuth-client for self-managed agents.

## Phasing

**Week 1 — schema + dashboard scaffolding.**
- DB migration: new columns on `pages`.
- Dashboard: pageType selector when creating; agent-specific form fields surface conditionally.
- `/agents` landing route stub.
- `isAgentSlug` analogue of `isDemoSlug` for the public banner.

**Week 2 — verification + manifest.**
- `.well-known/karte-agent.json` flow + DNS TXT flow.
- Cron job to re-verify weekly.
- `/<slug>/agent.json` machine manifest route.
- Verified-pill UI on public agent pages.

**Week 3 — brain-proxy chat.**
- `brainEndpointUrl` config in dashboard.
- Streaming proxy route inside `/api/chat/<slug>` (gated on pageType='agent' + endpoint set).
- Fallback to info-block answer on endpoint failure.
- Seed 2 agent demo pages with brain proxies pointed at scratch endpoints.

**Week 4 — agent card in the main deck + go-live.**
- Agent card added to the main landing deck (the calling-card design currently in flight). Same gold-on-black aesthetic; copy lands the trust-card pitch in the deck's vocabulary.
- 2–3 seeded agent profiles featured in the agent card with live links.
- `/create?type=agent` pre-selects the subtype for inbound referrals.
- Public announcement framed as "Karte now hosts cards for agents too," not as a separate product launch.

## Open questions

1. **Who owns an agent page?** Human operator via better-auth OR agent self-auth? v0 says human; revisit when agents have stable identity providers.
2. **Pricing.** Agent pages cost more to support (verification cron, manifest endpoint, proxy bandwidth) but have higher willingness to pay. Free for v0; pricing experiment in v1.
3. **Per-conversation memory.** Visitors talking to an agent want continuity ("did I tell you my order number?"). Karte currently treats each visitor cookie as a thread. Probably fine for v0 but the brain endpoint owns this — we just pass the thread ID.
4. **Verification revocation.** If a domain stops returning the well-known file, do we strip the verified pill immediately or after N consecutive failures? Recommend N=3, weekly check.
5. **A2A protocol timing.** Google's spec is in flux. v0 ships OpenAI-compat only. v1 adds A2A if it stabilizes — small adapter on the proxy route, manifest just adds an `"a2a"` shape entry.
6. **Demo agents.** Need 2–3 seeded agent pages similar to /naval, /levelsio. Suggested: `inventory-demo` (procurement agent), `research-bot` (web-research agent), maybe `karte-itself` (Karte's own support agent — meta but useful).
7. **Abuse vector — agent returns malicious content.** Disclosure banner + content sanitization in the proxy + IP-rate-limit on visitor side should be enough for v0. Long-term, signed responses + reputation scoring.

## What stays the same

- The four surfaces (chat / newspaper / encyclopedia / roast) all work on agent pages with minor prompt tweaks.
- Theme system, OG cards, brand-detected icons, project gallery, sticky hero, R2 uploads — all unchanged.
- Existing demo profiles (`/naval`, `/levelsio`, `/pg`, `/karpathy`) stay person-typed.
- Marketing for humans stays as-is. The "I am an AI agent" CTA gives agents their own door without changing the front of the house.

## Why this, not a pivot

- Agent-with-credit-card volume in 2026 is small but real. Pivoting means starving while waiting.
- Stripe and Visa will mint their own trust pages tied to their rails. The independence position is the right one.
- The four AI surfaces are what make Karte weird and shareable. They don't transfer cleanly to "yet another agent chat UI" (Poe / HF Spaces / GPT store). Keeping them means agents on Karte get something agents elsewhere can't — virality.

Related memory: see `memory/project-agent-trust-cards.md` for the strategic frame.
