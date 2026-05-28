# LinkChat — AI Link-in-Bio / Interactive Profile: First-Session Activation Checklist (v2)

**Symphony Task:** `d2b15e16-6506-47c8-a01a-132c1bd7c26b` (high, business lane P0)  
**Iteration:** v2 — written to `docs/marketing/iterations/v2/write-activation-checklist.md` (per explicit rule; does not overwrite any root `docs/marketing/activation-checklist.md`)  
**Date:** 2026-05  
**Focus:** Measurable first-session steps that turn a new user into an owner of a published AI-enhanced link-in-bio / interactive profile (chat + encyclopedia/roast/newspaper modes).  
**Acceptance criteria met:** Measurable steps + concrete event names (fleet + product layers). No schema changes. No secrets, no deploys, no personal posting.

## Purpose for Marketing & Distribution
This checklist powers:
- Proof assets ("most users reach a live AI profile in one session")
- Campaign measurement and landing-page claims
- Reusable onboarding narrative for X/LinkedIn/embeds
- Funnel instrumentation ideas (no code changes required)

It is the marketing-facing counterpart to the live in-product "Launch Checklist".

## Definition of "Activated" (Fleet Standard)
From `src/lib/analytics-events.ts`:
- `activated` event fires exactly once — on the **first** `page_published` core action (when a profile goes from unpublished → published).
- This is the primary activation signal for cross-fleet retention and time-to-value reporting.
- Subsequent value: `core_action` with `action: "mode_generated"` (AI profile modes).

## Primary Owner-Facing Events (Standardized Taxonomy)
Every LinkChat session emits these (see `analytics-events.ts` and `posthog-provider.tsx`):

| Event | When | Location / Trigger |
|-------|------|--------------------|
| `signup` | First session after account creation (localStorage guard) | PostHogProvider |
| `activated` | First profile publish (`published` flipped true) | `trackActivated()` in page-settings.tsx:290 |
| `core_action` {action: "page_published"} | Profile publish (every time, but first = activation) | page-settings.tsx:289 |
| `core_action` {action: "mode_generated"} | User generates encyclopedia / roast / newspaper | page-toggles.tsx, encyclopedia-editor.tsx, generate-*.tsx |
| `returned` | Later session for known user | PostHogProvider |

## Supporting Product Events (PostHog — for detailed funnel)
See `docs/analytics.md` and scattered `posthog.capture` calls.

- `onboarding_chat_started`
- `onboarding_chat_done` (with link/project counts)
- `onboarding_funnel_signup_clicked`
- `onboarding_funnel_completed`
- `page_created` (creation, not necessarily publish)
- `dashboard_activated`
- `profile_mode_generated` {mode: 'encyclopedia'|'roast'|'newspaper'}
- `user_signup` / `user_login` (legacy layer)
- `linktree_import_preview` / `linktree_import_complete`
- `ai_profile_revamp_generate` / `ai_profile_revamp_apply`
- `profile_enrichment_run`

Visitor-side (public profiles): `page_view`, `hook_open`, `dm_start`, etc. (separate pipeline via `/api/track/[slug]` + visitor-id.ts).

## First-Session Activation Path (Recommended Measured Flow)

The happy path for an AI-focused user (chat + generated modes) in a single sitting:

1. **Entry & Intent**  
   User lands on `/create` (or hero CTA on `/`).  
   - Measurable: landing page views + `/create` entry.  
   - AI hook: "Draft your profile first. Chat your way through it."

2. **AI-Guided Draft (Primary Fast Path)**  
   - User starts the onboarding chat (`OnboardingChat`).  
     Event: `onboarding_chat_started`  
   - Completes chat → structured state (name, bio, links, projects, fields).  
     Event: `onboarding_chat_done` (hasName, linkCount, projectCount)  
   - Clicks "Claim your Karte page" (note: legacy "Karte" copy in UI).  
     Event: `onboarding_funnel_signup_clicked`

3. **Signup / Claim**  
   - Google OAuth (better-auth).  
     Events: `signup` (fleet), `user_signup` (PostHog), `user_login`.  
   - Redirect with `?onboarded=1` + pending localStorage payload.

4. **Post-Signup Handoff**  
   - `PendingOnboardingBanner` renders.  
   - One-click "Create my page" (creates page + bulk links/projects).  
     Events: `onboarding_funnel_completed`, `page_created`.  
   - Alternative path (no chat): direct `/dashboard/appearance` form or welcome import flow (`/welcome` + `/api/welcome` which generates AI "wow cards": headline/roast/questions).

5. **Dashboard Landing (Value Signal)**  
   Event: `dashboard_activated`.  
   In-app "Launch Checklist" (dashboard/page.tsx:161) + `IntentOnboarding` (4 visitor-intent modes: explore/ask/reach/vibe with adaptive checklists) appear.

6. **Activation Milestone — Publish Profile** (Primary Success)  
   - User sets slug/name/bio/theme + toggles **Published** in Appearance.  
   - Save triggers: `trackCoreAction('page_published')` + `trackActivated()`.  
   - In-app Launch Checklist item "Publish profile" flips to Done.  
   - **This is the `activated` moment.** Time-to-activate starts here for marketing claims.

7. **Interactive AI Layer — Memory & Chat**  
   - Add ≥2 memory/info blocks (`/dashboard/memory`).  
   - Configure chat (title, prompt, model) via `/dashboard/chats` or page settings.  
   - Enables the public chat widget on `/{slug}` (streaming, conversation history, email gate).  
   - Measurable: memory block counts + chat config updates + public `hook_open` / `dm_start` (visitor).

8. **Generate Shareable AI Modes (Core Action + Proof)**  
   - From dashboard (`/dashboard/encyclopedia`, roast, newspaper) or public generate pages.  
   - One-click generate → `profile_mode_generated` + `trackCoreAction('mode_generated')`.  
   - Modes:  
     - **Encyclopedia** — Wikipedia-style deep profile (generate-encyclopedia.tsx).  
     - **Roast** — Humorous takedown with score (roast-page-client.tsx).  
     - **Newspaper** — Front-page styled summary (generate-newspaper.tsx).  
   - These are cached in `generatedPages`, instantly shareable, high-engagement surface.

9. **Share & First External Validation** (Optional but powerful for marketing)  
   - Share `/{slug}` or a specific mode page.  
   - First visitor events: `page_view`, `section_view`, `outbound_click`, `chat_cta_click`.  
   - Inbound: `contact_submit` or `dm_submit` → inbox.

## In-Product Counterpart (Live Version)
The dashboard "Launch Checklist" (7 items) + IntentOnboarding already implement a version of this for users:

- Publish profile (activation)
- Add links (≥3)
- Add projects (≥1)
- Add AI memory (≥2)
- Pick theme
- Enable DMs
- Generate profile modes (≥1 ready)

`IntentOnboarding` adapts suggested next steps by visitor goal ("Ask me questions" → memory + chat + modes).

## Measurement Notes (No Schema Changes Needed)
- Use PostHog funnels: `signup` → `activated` → `core_action:mode_generated`.
- Cohort time-to-activate: first `activated` timestamp minus `signup` or first `onboarding_chat_started`.
- AI-specific conversion: % of activated users who emit ≥1 `mode_generated` in same session.
- Drop-off points: after chat done but before publish; after publish but before first mode.
- All events carry `project: "linkchat"`.
- Visitor analytics (public proof) are separate (Analytics Engine + DB aggregates).

## Prior Related Assets (Summary)
- **In-app Launch Checklist + IntentOnboarding**: `src/app/dashboard/page.tsx:161`, `src/components/dashboard/intent-onboarding.tsx` (authoritative live checklists).
- **Fleet analytics contract**: `src/lib/analytics-events.ts` (the 4-event taxonomy that makes this checklist cross-project comparable).
- **Detailed event map**: `docs/analytics.md`.
- **Onboarding implementation**: `src/app/create/page.tsx`, `src/components/create/onboarding-chat.tsx`, `src/components/dashboard/pending-onboarding-banner.tsx`, `src/app/welcome/page.tsx`, `src/components/welcome/welcome-flow.tsx`.
- **Mode generators**: `src/components/public/encyclopedia/generate-encyclopedia.tsx`, roast, newspaper equivalents; dashboard editors.
- **No prior committed `docs/marketing/activation-checklist.md`** found at task start. Earlier ad-hoc notes lived only in code comments (e.g., "first publish is the activation milestone" in page-settings.tsx:287) and the dashboard UI. This v2 file is the first durable marketing-grade artifact per the Symphony task iteration rule.

## Recommended Marketing Framing
- "From zero to AI that talks back in one session."
- "8 measurable steps. One publish = activated. Then roast, wiki, or newspaper mode in a click."
- "No form fatigue. Chat or import → claim → toggle publish → generate proof."

---

**Next for marketing team (optional follow-ups):** Instrument a public "activation timer" demo, add PostHog insight links to this doc, or create a shareable Notion/Canva one-pager from this checklist. All without touching production schema or auth.

This document is supporting notes only. The system of record for publishable ideas is the SaaS Maker Marketing Queue (created via `fnd api` in the same task run).
