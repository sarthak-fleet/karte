# Creator Opportunity Desk

Owner-reviewed creator partnership signals and AI-assisted briefs. Shipped
2026-07-13. Spec-driven change archived under
`openspec/changes/archive/2026-07-12-add-creator-opportunity-desk/`.

## What it is

Karte already collects the two inputs a creator needs to act on commercial
opportunities: timely profile events and qualified inbound messages. The
Opportunity Desk is the agentic step that turns those signals into a
reviewable partnership angle and a usable draft reply or pitch — without
asking for Gmail or social-account access.

## Hard rules

- **Approval-first.** No draft leaves Karte until the owner explicitly approves
  it. The first release does **not** connect Gmail or Instagram, discover
  private contact details, send messages automatically, follow up
  automatically, or expose a brand marketplace.
- **Page-owned.** Every opportunity belongs to one Karte page; only that
  page's authenticated owner can list, create, read, update, generate,
  approve, or dismiss it.
- **Explicit generation.** A brief is generated only after the owner clicks
  Generate. Only the selected source snapshot + bounded profile context are
  sent to the AI provider.
- **AI output is labeled suggestion.** Matches and contact assumptions are
  suggestions the creator must verify.

## Lifecycle

```
signal → drafted → approved | dismissed
```

- A `signal` is created manually or from an eligible page-owned source:
  timeline event, qualified lead, contact submission, conversation, or
  received email (`sourceType` ∈ `manual|timeline|lead|contact|conversation|email`).
- Owner clicks Generate → one structured brief is produced, schema-validated,
  and stored (`drafted`).
- Owner reviews, edits, approves, dismisses, copies, or opens a verified
  recipient in their own mail client. **Karte does not send messages.**

## Data

- Table: `creatorOpportunities` (Turso). Additive only; no existing data
  transformed. See `migrations/d1/010_creator_opportunities.sql`.
- Request paths never create or alter this table at runtime; apply the
  migration explicitly before enabling the production surface.

## Surfaces

- Dashboard: `/dashboard/opportunities`.
- API: `/api/pages/[pageId]/opportunities/*` (owner-only, explicit, rate-limited
  brief generation).
- Reuses Next.js, Drizzle, Zod, and the existing AI client + profile-memory
  context. No new production package.

## Spec

Full requirements + scenarios: `openspec/specs/creator-opportunity-desk/spec.md`.
