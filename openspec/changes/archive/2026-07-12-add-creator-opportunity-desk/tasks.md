## 1. Data Model and Contracts

- [x] 1.1 Add the `creatorOpportunities` Drizzle schema, status/source types, indexes, and an additive SQL migration without runtime production schema mutation.
- [x] 1.2 Add Zod request and generated-brief schemas plus JSON parsing helpers that preserve a prior valid draft on failure.
- [x] 1.3 Add page-scoped opportunity data helpers for create, list, update, approve, dismiss, and source-snapshot resolution.

## 2. Owner-Only API and AI Generation

- [x] 2.1 Add owner-only list/create and item update endpoints with source ownership validation and bounded field lengths.
- [x] 2.2 Add the explicit generation endpoint using existing AI configuration, rate limiting, bounded profile/source context, and structured-output validation.
- [x] 2.3 Implement lifecycle guards: only valid drafts approve, material edits clear approval, dismissed sources remain intact, and failures preserve stored work.
- [x] 2.4 Ensure API responses fail closed and explain recovery when the table or AI provider is unavailable.

## 3. Opportunity Desk UI

- [x] 3.1 Add `/dashboard/opportunities` with empty, loading, error, signal, drafted, approved, and dismissed states using existing dashboard patterns.
- [x] 3.2 Add manual opportunity creation and eligible page-owned source selection from timeline and existing inbound/lead surfaces.
- [x] 3.3 Add the brief review editor for fit, timing, partnership angles, named-brand verification labels, recipient, subject, and body.
- [x] 3.4 Add explicit Generate, Approve, Dismiss, Copy, and Open in mail actions; expose Open in mail only for approved drafts with a verified recipient.
- [x] 3.5 Add Opportunity Desk to dashboard navigation and link relevant Lead Radar and Timeline source records into the workflow.

## 4. Verification and Handoff

- [x] 4.1 Add unit tests for generated-brief parsing, source ownership, lifecycle transitions, approval reset, and mailto construction.
- [x] 4.2 Add focused API tests covering cross-owner rejection, invalid sources, AI failure, invalid model JSON, and missing-table behavior.
- [x] 4.3 Run the focused tests first, then `pnpm typecheck`, `pnpm lint`, and the smallest relevant build check; record any skipped or environment-blocked validation.
- [x] 4.4 Update `PROJECT_STATUS.md` and user-facing help/copy only after the feature is implemented and verified; do not claim Gmail/social monitoring or autonomous sending.
