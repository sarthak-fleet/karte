# UI Audit

Surface-by-surface state vs the design system established on the landing.
Last audit: 2026-05-27.

**Status key**
- 🟢 **Green** — matches landing's design language (tokens, hairlines, off-white, single accent, no shadows, `cubic-bezier(0.16,1,0.3,1)` motion)
- 🟡 **Yellow** — partially migrated, some inconsistencies
- 🔴 **Red** — pre-revamp state, looks like a different product

## Public-facing pages (visitor-impact, fix first)

| Surface | Status | Notes |
|---|---|---|
| `/` landing | 🟢 | Token-migrated, manifesto narrative, sticky bubble navbar |
| `/[slug]` profile page | 🟡 | **Just migrated.** Tokens + theme.accentColor wired. Structure still feels like a brochure — could be lighter. |
| `/[slug]/encyclopedia` | 🔴 | Not audited yet — likely Wikipedia-styled and self-contained |
| `/[slug]/newspaper` | 🔴 | Front-page treatment, likely heavy serif + cream — needs token-aware chrome |
| `/[slug]/roast` | 🔴 | Roast comic styling, needs review |
| Chat widget overlay | 🔴 | 722-line client component, ships on every profile page |
| `/about`, `/privacy`, `/terms` | 🔴 | Footer-linked, low traffic but still represent brand |
| Public top bar (default variant) | 🟡 | Minimal variant is 🟢, default variant still uses old chrome |

## Auth funnel (first impression for signups)

| Surface | Status | Notes |
|---|---|---|
| `/login` | 🟡 | Touched recently (commit `927c23f`) — may already be partially aligned |
| `/create` | 🔴 | Page creation wizard — the first thing a new user sees |

## Dashboard pages (owner-only, lower visitor impact but daily UX)

| Surface | Status | Notes |
|---|---|---|
| Dashboard sidebar | 🟢 | Grouped, mobile drawer, top nav progress bar |
| `/dashboard` home | 🔴 | Not audited |
| `/dashboard/links` | 🔴 | + `link-editor.tsx` (520 lines client) |
| `/dashboard/projects` | 🔴 | + `project-editor.tsx` (393 lines client) |
| `/dashboard/pages` (modes) | 🔴 | + `page-toggles.tsx` (339 lines) |
| `/dashboard/sections` | 🔴 | + `section-editor.tsx` (563 lines) |
| `/dashboard/appearance` | 🔴 | Theme/color picker |
| `/dashboard/memory` | 🔴 | + `info-editor.tsx`, `ai-key-settings.tsx` |
| `/dashboard/encyclopedia` | 🔴 | + `encyclopedia-editor.tsx` (336 lines) |
| `/dashboard/inbox` | 🔴 | DMs |
| `/dashboard/leads` | 🔴 | Lead Radar |
| `/dashboard/chats` | 🔴 | + `chat-list.tsx` |
| `/dashboard/analytics` | 🔴 | Heaviest data load (9 sequential awaits) |
| `/dashboard/experiments` | 🔴 | A/B tests |
| `/dashboard/revamp` | 🔴 | + `profile-revamp-assistant.tsx` |
| `/dashboard/domains` | 🟢 | Notify-me CTA + token-migrated |
| `/dashboard/inbox-message-list` | 🔴 | Client component |

## Aggregate stats

- **174** `text-white` instances → should mostly be `text-karte-text`
- **136** `text-gray-*` instances → should be `text-karte-text-{2,3,4}`
- **82** hardcoded `bg-[#...]` → should be tokens
- **152** `border-white/N` → some keep, some should be `border-karte-border`
- **7** inline `boxShadow` → all should go (landing has zero)
- **2** remaining `#f2c879` (mostly cleaned up)

## Priority order (visitor-leverage × effort)

1. **Public profile structural polish** — `/[slug]` is migrated but the layout could be lighter, more like the landing. (~2 hr)
2. **Chat widget** — ships on every profile, 722 lines. Heavy lift but high visibility. (~3 hr)
3. **`/login` + `/create`** — first impression for signups. (~2 hr)
4. **Encyclopedia / Newspaper / Roast public pages** — these are the "viral surfaces" the landing promises. (~3-4 hr each)
5. **Public top bar (default variant)** — used on `/create`, `/login`. (~30 min)
6. **About / Privacy / Terms** — quick batch. (~1 hr total)
7. **Dashboard editor surfaces** — link/project/section/page editors. The owner spends most time here, but lower visitor-leverage. (~4-6 hr)
8. **Dashboard analytics** — depends on whether you ever show this to anyone but yourself. (~2 hr)

## Anti-goals

- Don't change functionality during this pass. Color / token / spacing migration only.
- Don't fork the design system. Land everything on `karte-*` tokens + Geist + Instrument Serif italic + cyan accent.
- Don't add new visual elements that aren't on the landing (no shadows, no new gradient styles, no rainbow accents).
