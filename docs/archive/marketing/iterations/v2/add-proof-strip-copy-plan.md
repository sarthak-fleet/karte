# Proof Strip Copy Plan — v2 (AI Link-in-Bio / Interactive Profile)

**Task ID:** 5cb9eb2e-17a9-4c89-aa6f-81a36578cc3a  
**Project:** linkchat (Karte)  
**Date:** 2026-05 (v2 iteration)  
**Status:** Ready for implementation

## Context & Scope

The landing page (`src/app/page.tsx`) currently has one "credibility strip" between the hero and the four-surfaces section. It contains four **technical** performance stats (TTFB, 0 JS, 330+ PoPs, 60s import). These are correct but they answer the wrong question above the fold — a creator deciding whether to sign up doesn't want a Cloudflare benchmark. They want to know: *who else is doing this, and does it work for them?*

This plan defines what **social/usage proof** should replace or augment the existing strip. No backend changes required; content can be static copy for now, graduated to real data once metrics are tracked.

**Prior related assets:**
- `docs/marketing/iterations/v2/add-email-capture-copy-variants.md` — 8 capture variants + Lead Radar context. Social proof reinforces those capture moments.
- Production landing: `src/app/page.tsx` — current `<Stat>` component row, hero, and four-surfaces section.
- Demo profile anchor: `karte.cc/sarthak` (live reference)
- Coming-soon demo profiles: Naval, Pieter Levels, Paul Graham (mentioned in hero placeholder card)

---

## 1. What the Strip Needs to Do

A proof strip above the fold should answer exactly one visitor objection: **"Is this real, and do people like me use it?"**

The three proof types in priority order for this product:

| Rank | Type | Why it works here |
|------|------|-------------------|
| 1 | **Social proof numbers** | Shows scale/traction without quotes. Works even pre-testimonials. |
| 2 | **Named testimonials** | One sentence from a recognizable-ish builder > any stat. High trust density. |
| 3 | **Live example links** | "See it on Naval's profile" is the most powerful proof — direct, interactive, zero friction. |

---

## 2. Metrics to Surface (and how to get them)

These are the numbers the strip should show. Marked with phase: **[now]** = can be static copy immediately, **[tracked]** = needs a DB query / analytics event.

### Option A — Traction-forward (recommended if ≥ 50 profiles exist)
```
[tracked]  {n}+ creators →  "profiles live"
[tracked]  {k}+ chats    →  "AI conversations handled"
[now]      60 s          →  "from Linktree/Beacons to live"
[now]      Free           →  "no card required"
```

**Copy for the stat cells:**

| Eyebrow | Value | Caption |
|---------|-------|---------|
| Profiles live | 120+ | and growing |
| AI conversations | 1,400+ | handled without a DM |
| Import time | 60 s | from Linktree or Beacons |
| Starting price | $0 | no card required |

*(Replace 120 / 1,400 with real DB counts once you have them. Even "12+" is honest and human.)*

### Option B — Value-forward (recommended pre-traction or launch)
Avoid fake numbers. Lead with outcomes instead:

| Eyebrow | Value | Caption |
|---------|-------|---------|
| DMs saved | ∞ | once the chat is live |
| Modes included | 4 | chat · wiki · newspaper · roast |
| Import time | 60 s | from Linktree or Beacons |
| Starting price | Free | no card, ever |

### Option C — Social-forward (once 2+ real testimonials exist)
Skip the stat row entirely above the fold; replace with a single scrolling testimonial marquee. Stats move below the fold.

---

## 3. Testimonial Copy

These are **template testimonials** written in the authentic voice of the target persona (indie builders, creators who get inbound). Sarthak should validate each with the real author before publishing — or use these as cold-outreach scripts to solicit the actual quote.

### T1 — The "it just works" builder
> "Pointed it at my Linktree and 60 seconds later my link answered three questions I get every week. Actually kind of unsettling."

**Ideal source:** Any indie dev or creator who imported from Linktree.  
**Strip format:** Quote + "@handle · indie hacker"

---

### T2 — The DM-fatigue persona (mirrors hero headline)
> "I get 30 DMs a day asking the same five questions. Karte now handles 90% of them before they hit my inbox."

**Ideal source:** Newsletter creator, agency founder, or anyone with public visibility.  
**Strip format:** Quote + "@handle · newsletter writer / 12k subs"

---

### T3 — The "this is the future of link-in-bio" take
> "Linktree gives people a list. Karte gives them a conversation. I don't think I'm going back."

**Ideal source:** Creator who's used both products.  
**Strip format:** Quote + "@handle · creator / {n}k followers"

---

### T4 — The roast/newspaper fan (virality angle)
> "The roast mode wrote a better burn about me than my friends could. Screenshot immediately sent to the group chat."

**Ideal source:** Anyone with a sense of humor who tried the roast surface.  
**Strip format:** Quote + "@handle"

---

### T5 — The "use it for professional inbound" persona
> "Put my consulting rates, availability, and stack in the memory. Now every 'pick your brain' request gets a helpful answer before I even see the DM."

**Ideal source:** Consultant, freelancer, or agency owner.  
**Strip format:** Quote + "@handle · freelance engineer / designer / consultant"

---

## 4. Live Example Anchors

These are the highest-leverage proof elements — clicking to a live AI profile is worth 10 testimonials. Two approaches:

### Approach A — "See it working on [name]" strip item
Place one or two live example links directly in the proof strip as a fifth/sixth cell.

**Copy:**
```
Try it live →  karte.cc/sarthak   "Ask anything"
Or browse →   karte.cc/[user2]    "Another live profile"
```

**Implementation note:** These can be `<Link>` components in the existing `<dl>` stat row, styled like the other cells but with an arrow CTA instead of a number.

### Approach B — Featured profile card (once demo profiles ship)
Once the Naval / Pieter Levels / Paul Graham demo profiles are live (mentioned in the hero placeholder card), add a "Live examples" sub-strip below the proof row:

```
┌──────────────────────────────────────┐
│  · Live examples                      │
│                                       │
│  [Naval]  [Pieter Levels]  [PG]       │
│  Ask the AI → ask the AI → ask the AI │
└──────────────────────────────────────┘
```

Copy for each card: "Trained on public writing. Ask it anything."

---

## 5. Recommended Above-the-Fold Proof Strip (v1 implementation)

Replace the current `<Stat>` row with this two-row arrangement. No layout change needed — just swap copy and add one marquee line below.

### Row 1 — Numbers strip (existing `<dl>` grid, 4 cells)
| Eyebrow | Value | Caption |
|---------|-------|---------|
| Profiles live | 120+ | creators, builders, writers |
| AI conversations | 1,400+ | DMs intercepted |
| Import time | 60 s | from Linktree or Beacons |
| Starting price | Free | no card, ever |

*(Use Option B value-forward copy until real numbers are available.)*

### Row 2 — Testimonial marquee (new, single line, scrolls on mobile)
One static rotating sentence, no carousel JS:

```
"The chat handled three questions I get every single week — before anyone had to DM me." · @handle
```

Swap to different quote on next deploy once more quotes are collected.

### Row 3 — Live example anchor (optional, single line)
```
· See it live on a real profile → karte.cc/sarthak
```

This is already present as the secondary CTA in the hero ("See it live ↗"). Consider moving it into the proof strip as a text link so the hero CTA stays singular.

---

## 6. Copy Variations for A/B

Three headline framings for the strip eyebrow label (the `<span>` that reads "· SPEED" today):

| ID | Label | When to use |
|----|-------|-------------|
| A | `· USED BY BUILDERS` | Traction phase — when you have real user counts |
| B | `· IN THE WILD` | Launch phase — when you have live profiles to link to |
| C | `· PROOF` | Neutral fallback — always honest |

---

## 7. What to Track Next

Once the proof strip is live, these are the events worth instrumenting (via existing `/api/track/[slug]` or a new landing-page-specific event):

| Event name | Trigger | Why |
|------------|---------|-----|
| `proof_strip_link_click` | Click on "See it live" in strip | Measures how many visitors convert from proof to exploration |
| `hero_cta_claim` | Click "Claim your name" | Primary conversion; proof strip should lift this |
| `example_profile_view` | Landing → karte.cc/sarthak | Funnel step between proof and signup |

Track with `lc_vid` cookie (already in `src/lib/visitor-id.ts`) for anonymous cohort analysis.

---

## 8. Outreach Scripts to Collect Real Testimonials

Send these to early users or testers to get authentic quotes. Keep them short.

**Email / DM template:**
> Hey [name] — you set up a Karte profile a while back. Would you be up for a one-sentence quote about what's actually useful for you? Totally optional, but I'm adding a testimonial strip to the landing page and want real voices rather than made-up ones. Even "here's the one thing it actually did for me" works perfectly.

**Response prompt if they're stuck:**
> What's the one thing Karte handles that you used to answer manually?

---

## Related v2 Assets
- `docs/marketing/iterations/v2/add-email-capture-copy-variants.md` — 8 capture variants; proof strip drives traffic into these capture moments.
- `docs/marketing/iterations/v2/write-onboarding-email-sequence.md` — post-signup nurture; proof strip sets expectations that sequence must meet.
- `docs/marketing/iterations/v2/write-activation-checklist.md` — activation steps; proof strip should visually echo what activated looks like.

---

**Source of truth for publishable ideas:** SaaS Maker Marketing Queue (created via task 5cb9eb2e-17a9-4c89-aa6f-81a36578cc3a). This repo doc is supporting notes only.
