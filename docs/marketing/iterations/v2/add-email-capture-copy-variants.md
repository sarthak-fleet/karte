# Email Capture Copy Variants — v2 (AI Link-in-Bio / Interactive Profile)

**Task ID:** 972aaec2-f88d-4f76-a77b-d7d909812e14  
**Project:** linkchat  
**Date:** 2026-05 (v2 iteration)  
**Status:** Ready for implementation / A/B

## Context & Scope
This v2 asset provides 8 ready-to-use CTA + form + privacy + success copy variants for email capture surfaces tied to the AI link-in-bio / interactive profile experience (chat, encyclopedia, roast, newspaper modes).

**Why v2 under iterations/**: Per Foundry Symphony iteration rule for this marketing task. The first-pass `docs/marketing/email-capture-copy.md` path is intentionally avoided. This lives in the iterations history for traceability.

**Prior related assets (summarized):**
- Production implementation: [src/components/public/chat-email-gate.tsx](../../../src/components/public/chat-email-gate.tsx) — current "One quick step" microcopy used for visitor chat leads on public profiles. Includes inline privacy ("We use this once so {name} can follow up — no spam.") and error states. Gate is mandatory; no skip.
- Lead management: [src/app/dashboard/leads/page.tsx](../../../src/app/dashboard/leads/page.tsx) ("Lead Radar") — qualifies chat + contact submissions into hot/warm/exploring tiers. Sources tracked: chat, contact form, events.
- Contact surface: [src/components/public/contact-form-section.tsx](../../../src/components/public/contact-form-section.tsx) — name + email + message with success "Message sent. You should hear back soon."
- Analytics: [docs/analytics.md](../../analytics.md) — visitor identity (`lc_vid` cookie + localStorage) and `/api/track/[slug]` for conversion measurement.
- No `docs/marketing/` directory or prior email-capture copy doc existed at task start (marketing/ created as part of v2 work).
- Product value props (landing): "Stop answering the same DMs", 3 mechanics (feed memory → pick modes → share one link), 4 AI surfaces.

**Copy principles (from production + brand):**
- Ultra-short. 1-2 sentences max for primary copy.
- Benefit-first or curiosity ("your AI profile already knows").
- Privacy always explicit, respectful, and specific ("no spam", "we hate inbox clutter too", "one email", "unsubscribe in one click").
- Success sets clear next-step expectation (what arrives, when, for how long).
- Glassmorphism / dark UI friendly: title case sparingly, sentence case preferred for body.
- Personalizable: support `{displayName}` or profile owner tokens where relevant.
- Goal: turn profile visits and product interest into owned, follow-up-able leads without friction or creepiness.

## The 8 Variants

### 1. Chat Gate (Production baseline + slight polish)
**Use case:** Inline above chat input on any public AI profile (current primary capture).

**Headline / micro-label:** One quick step

**Body:** Drop your email to start chatting. {displayName} will see who reached out and can follow up in their real voice.

**Form:**
- Label: (none, implied)
- Placeholder: you@example.com
- Button: Continue

**Privacy note:** We use this once so {displayName} can follow up — no spam.

**Success:** Gate disappears; chat input activates immediately. (No separate success toast in current flow.)

---

### 2. Full Modes Unlock (Encyclopedia + Roast + Newspaper)
**Use case:** Teaser card or modal on profile when only chat is free; upsell the other 3 AI surfaces.

**Headline:** Unlock the full AI profile

**Subhead:** Get the encyclopedia, roast, and newspaper versions — generated in {displayName}'s voice. Takes 5 seconds.

**Form:**
- Email placeholder: you@domain.com
- Button: Unlock the 3 modes

**Privacy note:** One email. We send the private links and that's it. Unsubscribe anytime.

**Success message:** Links sent. Check your inbox (and spam folder). They stay live for 7 days.

---

### 3. Creator Lead Magnet — "Voice Audit"
**Use case:** Landing page, /create success screen, or post-import banner. Acquires creator emails with high-intent value.

**Headline:** Free 60-second AI voice audit of your links

**Subhead:** See exactly how your profile would answer the 5 most common questions — before you publish.

**Form:**
- Email placeholder: you@yourdomain.com
- (Optional name field: "Your name or brand")
- Button: Email my audit

**Privacy note:** We send the audit + 3 copy-paste starter prompts. No weekly blast. Unsubscribe in one click.

**Success message:** Audit on the way. Check your inbox in the next 2 minutes. (Includes a one-click import link back to Karte.)

---

### 4. Weekly AI Profile Tips (Product acquisition / retention)
**Use case:** Site-wide footer, landing hero secondary CTA, or post-signup nurture for creators.

**Headline:** Make your link-in-bio do the talking

**Subhead:** One 90-second tip every Tuesday on prompts, new modes, and turning visitors into warm leads. 1,200+ creators already in.

**Form:**
- Email placeholder: you@domain.com
- Button: Send me the tips

**Privacy note:** One email a week. No fluff, no affiliate spam. Unsubscribe in a single click.

**Success message:** You're in. First tip lands this Tuesday. (You can also grab the full variant pack anytime.)

---

### 5. "Skip the Cold DM" Visitor Nudge
**Use case:** Prominent card or floating bar on high-traffic profiles (alternative or complement to chat widget).

**Headline:** Skip the cold DM

**Subhead:** Chat with the AI that already knows {displayName}'s rates, availability, and boundaries. Leave your email so they can reply personally.

**Form:**
- Placeholder: your@email.com
- Button: Open the AI chat

**Privacy note:** We only use this so {displayName} can follow up. No lists, no surprises.

**Success message:** Email saved. The chat is now yours — ask anything.

---

### 6. Post-Chat Deep-Dive Capture
**Use case:** After a visitor has had 3+ exchanges in chat; contextual upsell before they leave.

**Headline:** Want the roast + newspaper edition?

**Subhead:** We'll email you a full roast scorecard and front-page newspaper for this profile — generated fresh in their voice.

**Form:**
- Email (pre-filled if already captured, otherwise prompt)
- Button: Send me the deep dive

**Privacy note:** Single email. No follow-up sequence unless you reply.

**Success message:** Fresh roast + newspaper hitting your inbox in ~30 seconds.

---

### 7. Creator Early Access / Beta (Future modes)
**Use case:** /dashboard or landing "coming soon" section for auto-DM replies, advanced memory, or multi-profile.

**Headline:** Be first to try auto-DM replies from your AI

**Subhead:** 25 spots for the private beta. Your profile will draft real replies you can approve or tweak.

**Form:**
- Email placeholder: you@domain.com
- Button: Reserve my spot

**Privacy note:** Beta updates only. We won't sell or spam your list.

**Success message:** Spot reserved. You'll hear from the team within 48 hours with next steps.

---

### 8. Post-Create "Make It Magnetic" Pack
**Use case:** Immediate post-onboarding / after first publish in dashboard or welcome flow. High-intent creator moment.

**Headline:** Your page is live. Now make it convert.

**Subhead:** Get the exact 8 CTA + form variants (this doc) plus the 5 highest-converting chat starters we see working right now.

**Form:**
- Email placeholder: you@domain.com (or prefill from account)
- Button: Email me the conversion pack

**Privacy note:** One-time send + occasional high-signal updates. Unsubscribe forever with one click.

**Success message:** Pack sent. Check your inbox. (Pro move: enable the chat gate in settings before you share the link.)

---

## Usage Notes
- All variants assume the same visual treatment as the current glassmorphism UI (subtle borders, accent buttons, 10-13px micro text for privacy).
- Personalization tokens (`{displayName}`) should be rendered server or client where possible.
- Track with existing analytics: page events + visitor ID for source attribution (chat vs modes unlock vs landing magnet).
- Recommended test: run 2-3 variants in an experiment on high-traffic profiles; measure email capture rate + downstream reply rate in Lead Radar.
- Keep success messages actionable and time-bound when possible.

## Next Steps (for implementers)
1. Pick 2-3 variants for initial surfaces (recommend #1 refinement + #2 + #3 or #8).
2. Wire to existing lead creation path (`/api/chat/...` already persists email; expand for new surfaces).
3. Add to SaaS Maker Marketing Queue (this task) for distribution assets.
4. Update this doc with real A/B results or new variants that win.

---

**Source of truth for publishable ideas:** SaaS Maker Marketing Queue (created via `fnd api` in this task run). This repo doc is supporting notes only.

**Related Symphony task:** 972aaec2-f88d-4f76-a77b-d7d909812e14 (high priority, P0 marketing lane).

Ready for copy-paste into components or Figma specs.
