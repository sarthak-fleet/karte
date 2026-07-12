## Why

Karte already collects the two inputs a creator needs to act on commercial opportunities: timely profile events and qualified inbound messages. What is missing is the agentic step that turns those signals into a reviewable partnership angle and a usable reply or pitch, so creators still have to recognize, frame, and chase each opportunity themselves.

The reference product at `oportunities.ai` validates the broader desire, but Karte can reach the useful wedge without asking for Gmail or social-account access: build an approval-first Opportunity Desk on top of data the creator already owns in Karte.

## What Changes

- Add an authenticated `/dashboard/opportunities` surface that groups commercial signals from creator timeline events and existing inbound sources.
- Let a creator start an opportunity manually from a moment or select an eligible existing signal, then ask Karte to generate a structured opportunity brief.
- Generate reviewable candidate brand categories or named-brand hypotheses, fit rationale, lead time, partnership angles, and a draft reply or pitch from the creator's profile memory.
- Persist the opportunity lifecycle so a creator can review, edit, approve, dismiss, copy, or open a draft in their mail client without losing state.
- Require explicit approval before any draft leaves Karte. The first release will not connect Gmail or Instagram, discover private contact details, send messages automatically, follow up automatically, or expose a brand marketplace.
- Clearly label AI-generated matches and contact assumptions as suggestions that the creator must verify.

## Capabilities

### New Capabilities

- `creator-opportunity-desk`: Detect or create creator opportunity signals, generate approval-ready partnership briefs and drafts, and manage their review lifecycle.

### Modified Capabilities

None. There are no existing OpenSpec capability contracts in this repository.

## Impact

- **Dashboard:** new opportunity navigation and review surface alongside Inbox, Leads, Timeline, and Memory.
- **API:** owner-only endpoints to list/create/update opportunities and explicitly request AI analysis or draft generation.
- **Data:** new Turso-backed opportunity records linked to a page and, where applicable, a timeline event or inbound source.
- **AI:** uses the existing free-ai gateway and existing profile-memory context; generation is user-triggered and rate-limited.
- **Privacy and safety:** operates only on data already owned by the authenticated page owner; no new third-party account permissions or autonomous external writes.
- **Dependencies:** no new production package is expected. The change reuses Next.js, Drizzle, Zod, and the existing AI client.
