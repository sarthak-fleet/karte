## Context

Karte already has authenticated dashboard navigation, page ownership checks, timeline events, profile memory, qualified leads, contact submissions, chat transcripts, and received email. Those are enough to build a useful opportunity workflow without connecting third-party inboxes or social accounts.

The current product has no durable commercial-opportunity record. Lead Radar ranks people who reached out, while Timeline stores creator moments; neither turns a signal into a partnership thesis or reviewable draft. The repository also lacks a fully reliable production migration pipeline, so the data model must ship with an explicit migration and rollback path rather than relying only on runtime table creation.

## Goals / Non-Goals

**Goals:**

- Give the page owner one place to turn a manual moment, timeline event, or inbound signal into a commercial opportunity.
- Generate a structured, editable brief with fit rationale, timing, partnership angles, and a draft reply or pitch.
- Make provenance, AI uncertainty, and approval state visible.
- Reuse existing auth, AI, rate limiting, dashboard, and profile context patterns.
- Keep all external communication user-initiated in the first release.

**Non-Goals:**

- Gmail, Instagram, or other third-party account connections.
- Background monitoring of private conversations or social activity.
- Private brand-contact discovery, enrichment, or scraping.
- Autonomous sending, follow-ups, negotiation, contracting, billing, or marketplace features.
- Claiming that a suggested named brand is current, interested, or reachable.

## Decisions

### 1. Add an Opportunity Desk, not a second lead inbox

The dashboard gets `/dashboard/opportunities` under the existing Inbound group. Lead Radar remains the view of people and intent; Opportunity Desk is the view of commercial actions. An opportunity may reference a lead, email, contact submission, conversation, timeline event, or no source at all.

Alternative considered: add draft actions directly to every existing inbox surface. That would scatter lifecycle state across four source models and make cross-source review difficult.

### 2. Use one durable opportunity record with source provenance

Add a `creatorOpportunities` table linked to `pages`. The record stores:

- source type and optional source id;
- a short source snapshot safe to display if the source later changes;
- creator-entered moment, target, recipient, and notes;
- lifecycle status (`signal`, `drafted`, `approved`, `dismissed`);
- structured analysis JSON with a schema version;
- editable subject and body;
- approval and update timestamps.

Source ids are intentionally not hard foreign keys because eligible sources live in multiple tables and some can be deleted. All queries remain page-scoped and owner-only.

Alternative considered: separate tables for signals, recommendations, and drafts. One table is easier to ship and sufficient while each opportunity has one active draft. Draft history can be added only after real editing/versioning demand appears.

### 3. Make opportunity creation and generation explicit user actions

The UI presents recent eligible sources and a manual form. Selecting a source creates a durable `signal`; clicking Generate calls an owner-only generation endpoint. No cron, queue, webhook, or page-load generation is introduced.

This keeps AI cost predictable, avoids surprise analysis of private messages, and provides a clear consent boundary. Generation uses the existing free-ai gateway, the current rate limiter, and the page's configured/default AI settings.

### 4. Generate structured JSON through the existing text client

The generation prompt asks for versioned JSON and the server validates it with Zod before persistence. The payload includes a concise opportunity title, lead-time assessment, fit rationale, risk notes, up to four partnership angles, brand categories, optional named-brand hypotheses, and one draft.

The prompt receives only the selected source snapshot plus bounded page/profile context needed for relevance. Raw email bodies, entire chat histories, and unrelated inbox items are excluded. Invalid model output returns a recoverable error and does not replace a prior valid draft.

Alternative considered: add a new structured-output AI dependency. The existing AI SDK and Zod are sufficient, so no production dependency is needed.

### 5. Treat named brands as hypotheses and recipients as user-verified

Generated named-brand suggestions are visibly labeled “AI suggestion — verify fit and contact.” The model is not asked to invent personal email addresses. An outbound draft cannot expose an Open in mail action until the owner supplies a syntactically valid recipient. Inbound email opportunities can prefill the source sender address while still requiring approval.

### 6. Approval is a state transition, not permission to send

The owner can edit a draft, mark it approved, copy it, or open a `mailto:` link. Karte does not send the message. Editing an approved draft returns it to `drafted`, preventing a changed message from retaining a misleading approval state.

Alternative considered: send through the existing Cloudflare Email binding. That binding is for service notifications and inbound-mail handling, not impersonating the creator's mailbox; using it would violate the product's trust model.

### 7. Ship the schema through the repository's migration path

Add the Drizzle schema definition and a matching SQL migration artifact. Apply the migration only during an explicitly authorized deployment. Code must fail closed with a clear unavailable state if the table is absent; it must not mutate production schema on a request path.

## Risks / Trade-offs

- **[AI suggests a poor or stale brand match]** → Label named brands as hypotheses, show rationale and risk notes, prohibit invented contacts, and require user verification.
- **[Private source content is over-shared with the model]** → Send only the selected, bounded source snapshot and relevant profile context; never scan the entire inbox or all conversations implicitly.
- **[A source is deleted after opportunity creation]** → Keep a short immutable source snapshot and tolerate a missing source id.
- **[Draft is changed after approval]** → Reset status to `drafted` and clear `approvedAt` on any material draft edit.
- **[AI is unavailable or emits invalid JSON]** → Preserve the signal and any prior valid draft, return a retryable error, and keep manual editing available.
- **[Users expect autonomous outreach from the positioning]** → Name the first release “Opportunity Desk,” state “Karte never sends,” and keep integrations in non-goals until the approval loop is proven.

## Migration Plan

1. Add and locally validate the Drizzle model plus SQL migration.
2. Ship code behind the existence of the new route/surface; do not apply production schema changes without deployment approval.
3. Apply the migration before enabling the production navigation item.
4. Verify owner isolation, generation failure handling, approval reset, and copy/mailto behavior.
5. Roll back the UI/API independently if needed; leave the additive table in place to avoid destructive rollback. No existing data is transformed.

## Open Questions

- After the manual approval loop has usage, should the next integration be Gmail draft creation (still no send) or public-source monitoring? This does not block the first release.
