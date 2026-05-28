# Karte Onboarding Email Sequence v2

**Project:** linkchat (Karte)  
**Focus:** AI-powered link-in-bio / interactive profile with chat, encyclopedia, roast, and newspaper modes  
**Status:** v2 iteration (supporting asset)  
**Date:** 2026-05 (Symphony task 8e14cafc-f13f-4816-9f08-464103785ce0)

## Context & Prior Assets

- No first-pass `docs/marketing/onboarding-email-sequence.md` exists in linkchat/docs/marketing/.
- This v2 follows the established `iterations/v2/` pattern used across the fleet (see `../reader/docs/marketing/iterations/v2/` and `../swe-interview-prep/docs/marketing/iterations/v2/` for sibling examples).
- Related in-app flow: unauthenticated + authenticated onboarding chat lives in `src/components/create/onboarding-chat.tsx`, `src/app/api/onboarding/chat/route.ts`, `src/components/dashboard/pending-onboarding-banner.tsx`, and welcome routes. This email sequence is the *post-activation* lifecycle layer for retention and feature discovery.
- Primary system of record for distribution assets: SaaS Maker Marketing Queue (`/v1/marketing/posts`, channel `x` or `email`). Repo docs are optional notes only.
- Product value props (from landing + public pages): "Stop answering the same DMs", <100ms edge profiles, 60-second import, 4 AI surfaces from one link, free tier, your voice via memory blocks + projects + info.

## Sequence Overview (5 short lifecycle emails)

All emails are intentionally short (<140 words body), plain-text friendly, mobile-first, with one primary CTA. Voice: confident, slightly witty, zero corporate fluff. Use {{firstName}} and {{profileUrl}} where available.

### 1. Welcome / Account Created
**Trigger:** better-auth Google signup success (or welcome route completion) — immediate or +5min delay.

**Subject:** Karte is live — your link-in-bio now answers for you

**Body:**
Hi {{firstName}},

You just claimed your name.

Karte turns one link into a profile that talks back in your exact voice — rates, availability, "no free work", current projects, all of it.

Import your existing links from Linktree, Beacons, or Bento in 60 seconds. Or start fresh.

Flip Chat mode on and stop typing the same replies 20 times a week.

**CTA:** Set up your profile in 60 seconds → /dashboard (or direct to create if pending)

**CTA Link example:** https://linkchat.sarthakagrawal927.workers.dev/dashboard

### 2. Profile Published / First Live
**Trigger:** First page published (or first successful / [slug] visit tracked via /api/track).

**Subject:** Your profile is live. Now let the AI do the talking.

**Body:**
Nice — {{profileUrl}} is out in the world.

One link. Four surfaces.

Visitors land, ask anything, and the chat replies like you would (because you fed it your memory blocks, links, and boundaries).

Most people stop here and still do 80% of the work manually. Don't be most people.

**CTA:** Add 3 memory facts that save you the most time → /dashboard/memory (or appearance)

### 3. Day 2–3: Discover the Other Modes
**Trigger:** 48 hours after publish OR first inbound chat message received (via conversations table).

**Subject:** Chat is only one of four ways to show up

**Body:**
Your Karte profile has four personalities:

- Chat (answers live questions)
- Encyclopedia (clean wiki-style deep bio)
- Roast (brutally honest, shareable)
- Newspaper (front-page summary of you)

Most new users only turn on chat. The others do the heavy lifting for thought-leadership, humor, and press-style credibility — automatically.

**CTA:** Toggle the full set on your public page → /dashboard/appearance

### 4. Week 1: Proof + Power Move
**Trigger:** 7 days after publish OR after 5+ tracked page events / 1+ conversation with 3+ messages.

**Subject:** Someone already asked your AI something you used to type

**Body:**
Real talk: the first time your Karte profile answers a "what's your rate?" or "are you available for X?" before it hits your inbox feels illegal.

You're 7 days in. If you haven't added projects or tuned the tone yet, now's the moment. The difference between "kinda useful" and "I can't live without this" is about 15 minutes of memory.

**CTA:** See what people are actually asking → /dashboard/inbox (or chats)

### 5. Feedback / Power User Loop
**Trigger:** 14 days post-signup OR after first lead captured via contact form OR manual "check-in" batch.

**Subject:** Quick question — what question does your Karte still miss?

**Body:**
We're making the best AI-first link-in-bio on the planet.

Your real inbound is the only data that matters. Reply with one question you still get manually that Karte hasn't handled cleanly yet, or just drop your public profile link so we can see how you're using the modes.

The next features (custom domains, better voice cloning, lead qualification) will be shaped by people like you.

**CTA:** Reply to this email (or share profile + feedback)

---

## Implementation Notes (for future wiring)
- Email provider: saas-maker now uses Cloudflare Email + React Email templates (see packages/blocks/email/).
- Triggers: Can be driven from pageEvents analytics, conversations count, or simple time-based jobs once a worker/cron is added.
- Personalization: Pull from users table + first published page.
- Measurement: Track opens/clicks back into PostHog or SaaS Maker analytics for this project; add to /api/track if needed.
- A/B: Start with 2 subject variants per email.
- Do not send to users who have opted out or have zero activity after 30d.

## Related Distribution Assets
- Primary: SaaS Maker Marketing Queue entries (this task will create several X ideas pointing at the product + this sequence as proof of craft).
- Landing hero + 4-mode demos already live.
- In-app onboarding chat as first-touch activation.

This v2 asset is complete, scoped, and ready for copy review + integration. Repo doc only — queue the actual publishable ideas via the Marketing Queue API.

## Marketing Queue Ideas (X channel) — Ready for Direct Creation

Per Symphony task contract, these 4 ideas were prepared for direct insertion via:

```bash
# Generic (after `fnd login` for prod session):
fnd api POST /v1/marketing/posts --auth session --body 'JSON_HERE'

# On this machine (fnd not in PATH, config currently dev-localhost):
node /Users/sarthak/Desktop/fleet/saas-maker/packages/cli/dist/index.js \
  api POST /v1/marketing/posts --auth session \
  --body 'JSON_HERE'
```

**Important:** Current `~/.foundry/config.json` targets localhost dev worker + `sm_` project key (not a prod user session token from `fnd login`). Do not edit the config. Run the commands only after proper prod session is active (or paste the bodies manually via Cockpit UI). All use the exact task ID as source.

### Idea 1
```json
{
  "project_slug": "linkchat",
  "channel": "x",
  "status": "generated",
  "source_type": "task",
  "source_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "task_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "title": "Your link-in-bio should answer the DMs you hate",
  "hook": "Stop typing the same replies.",
  "body": "Karte is the AI link-in-bio that knows your rates, projects, and boundaries. Chat mode replies in your voice before messages hit your inbox. Same link also gives encyclopedia, roast, and newspaper views.",
  "cta": "Claim your name (free, 60s import) → https://linkchat.sarthakagrawal927.workers.dev/create"
}
```

### Idea 2
```json
{
  "project_slug": "linkchat",
  "channel": "x",
  "status": "generated",
  "source_type": "task",
  "source_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "task_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "title": "One link. Four personalities.",
  "hook": "Most link-in-bios are dead pages.",
  "body": "Karte turns your profile into Chat (live Q&A in your voice), Encyclopedia (clean wiki), Roast (brutal + shareable), and Newspaper (press-style summary). All auto-generated from what you feed it.",
  "cta": "See it live → https://linkchat.sarthakagrawal927.workers.dev/sarthak"
}
```

### Idea 3
```json
{
  "project_slug": "linkchat",
  "channel": "x",
  "status": "generated",
  "source_type": "task",
  "source_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "task_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "title": "<100ms profiles, globally",
  "hook": "Your link-in-bio loads before they look away.",
  "body": "Edge-rendered on Cloudflare. Sub-100ms median TTFB worldwide. Import from Linktree/Beacons/Bento in 60 seconds. Free tier. Your voice, not a template.",
  "cta": "Make yours now → https://linkchat.sarthakagrawal927.workers.dev/create"
}
```

### Idea 4 (task meta — proof of repeatable assets)
```json
{
  "project_slug": "linkchat",
  "channel": "x",
  "status": "generated",
  "source_type": "task",
  "source_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "task_id": "8e14cafc-f13f-4816-9f08-464103785ce0",
  "title": "v2 onboarding emails for AI link-in-bios",
  "hook": "5 triggers. Zero corporate fluff.",
  "body": "Just wrote the lifecycle sequence for Karte: welcome → profile live → discover 4 modes → proof at day 7 → feedback loop. Short, event-driven emails that turn publishers into power users who let the AI handle inbound.",
  "cta": "Try the product → https://linkchat.sarthakagrawal927.workers.dev/create . Feedback on the sequence welcome."
}
```

After queuing (status stays "generated"), review/accept/reject in SaaS Maker Cockpit → Marketing Queue. Accepted ideas can later be marked "sent".

## Completion Notes for This Task
- Supporting doc created (no code or secret changes).
- 4 X ideas prepared exactly to contract (title/hook/body/cta, task-linked, channel x, status generated).
- Direct API creation blocked in this agent session by dev-only `~/.foundry/config.json` (localhost + project key, no prod session token). Per fleet rules, did not edit config/secrets.
- To finish: (1) run the 4 POSTs above from a shell with valid prod `fnd login` session, (2) run `pnpm --dir ~/Desktop/fleet/saas-maker symphony done 8e14cafc-f13f-4816-9f08-464103785ce0` (or use Cockpit "done" action).
- Changed files: only the new v2 iteration doc.
- Evidence: file written, content verified, 4 payloads match task ID and Marketing Queue schema.
- Remaining risk: none in repo; manual queue step required by human with prod auth. No public posts performed.

