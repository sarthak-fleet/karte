# Timeline block — spec v0.1

**Status:** Draft, queued.
**Owner:** Sarthak.
**Last touch:** 2026-05-28.

## TL;DR

A `timeline` content block on Karte profiles — dated events (joined-company, shipped-project, wrote-essay, spoke-at, launched-product, life-event). The block surfaces on the public profile as a visual timeline AND feeds every AI surface (chat/encyclopedia/newspaper/roast) with dated context the model currently has to guess at.

The wedge over LinkedIn isn't the timeline itself — it's **auto-fill from real signals** (GitHub events, RSS, X handle, Substack). The user curates; they don't write. That's the moat LinkedIn can't copy because LinkedIn doesn't watch your GitHub.

## Goals

1. Persons + agents can both attach a timeline. Agents get deployment / capability-change / ownership events; persons get career + project + life events.
2. Each timeline entry is a dated card: `{ when, what, where, type, link, body }`.
3. Auto-fill from at least one source (GitHub) in v0. RSS + X + Substack in v1.
4. The chat / encyclopedia / newspaper / roast prompts all receive the timeline as additional source context.
5. Public profile renders the timeline as a section (typographic vertical timeline with gold rule, matches the Onyx aesthetic).

## Non-goals (v0)

- Cross-user social graph (no "X and Y both joined Z").
- Embedded media beyond a thumbnail + link.
- Per-event reactions / comments.
- Timeline-driven feed of all users.
- Editing the timeline collaboratively.

## Schema

```ts
export const timelineEvents = sqliteTable('timelineEvents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),

  // The thing that happened.
  type: text('type').notNull(),
  //   'joined-company' | 'shipped-project' | 'wrote-essay' |
  //   'launched-product' | 'spoke-at' | 'shipped-release' |
  //   'moved-to' | 'life-event' | 'agent-deployed' |
  //   'agent-capability-added' | 'agent-ownership-changed' | 'custom'

  // Display fields.
  title: text('title').notNull(),
  body: text('body'), // optional 1-3 sentence detail
  where: text('where'), // optional org / location / venue
  link: text('link'), // optional canonical URL (commit, blog post, etc.)
  imageUrl: text('imageUrl'), // optional thumbnail

  // When (use a string like '2024-03' or '2024-03-15' — full dates often
  // not available for auto-fill, and prose-style dates display better
  // than enforced timestamps).
  whenLabel: text('whenLabel').notNull(),
  // Sortable ISO date — when whenLabel is '2024-03', this is '2024-03-01'.
  // When whenLabel is 'circa 2018', sortDate is '2018-01-01' and the UI
  // hides the day.
  sortDate: integer('sortDate', { mode: 'timestamp' }).notNull(),

  // Where this came from. 'manual', 'github', 'rss', 'x', 'substack'.
  // 'pending-review' status lets auto-imports queue without showing
  // publicly until the user approves.
  source: text('source').notNull().default('manual'),
  status: text('status').notNull().default('published'), // 'published' | 'pending-review' | 'hidden'

  // For auto-fill dedup: the external resource id (commit sha, post
  // guid, tweet id, etc.) so we don't re-import the same event.
  externalId: text('externalId'),

  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

Unique index on `(pageId, source, externalId)` so re-running an import is idempotent.

## Auto-fill source — GitHub (v0)

User connects their GitHub username (no OAuth needed for public data — github REST API allows un-auth fetches with rate limits).

Cron job (daily, per-user):
1. Fetch `https://api.github.com/users/<username>/events/public`
2. For each event of interest, transform into a `timelineEvent`:
   - `PushEvent` to a public repo → "Pushed N commits to <repo>" with link to compare URL
   - `CreateEvent` (repository) → "Started a new project: <repo>"
   - `ReleaseEvent` → "Released <repo> v<tag>" with release URL
   - `PullRequestEvent` (closed+merged) → "Merged a PR into <repo>"
3. Hand each candidate to a tiny AI prompt that:
   - Rewrites the github-y phrasing into the owner's voice ("Released the v2 of nanoGPT — added a better tokenizer and a smaller model" rather than "Pushed to karpathy/nanoGPT")
   - Skips trivial events (single typo fixes, dotfile commits)
   - Returns a structured `{ title, body, type }`
4. Insert with `source: 'github'`, `status: 'pending-review'`, `externalId: <event id>`

The user sees pending events as a banner on /dashboard/timeline; one click approves or trashes each.

## AI surface integration

`buildProfileMemory()` already aggregates bio + links + projects + info-blocks into the source-cards passed to each AI prompt. Add a section for timeline events:

```
TIMELINE (recent first):
- 2026-03 | Released TinyGPT — 0.8M-param browser transformer
- 2025-02 | Joined VaultWealth — backend + AI infrastructure
- 2024-09 | Built RAG support agents at Front.Page — cut human load 90%
- 2024-01 | Shipped vector-powered feed — +40% engagement
- 2022-01 | Joined Front.Page (YC S21) — backend + data infra
```

This unlocks new prompt patterns:

- Chat: "what did you ship last month?" → uses recent entries
- Encyclopedia: career section is now factual not vibes
- Newspaper: Page 1 "Last week, X shipped Y" / Page 2 "Looking back: the year that was"
- Roast: "Three startups in 18 months. Confidence or restlessness?"

## Public profile render

A new `<TimelineSection />` between the bio and the link/project bento. Renders most-recent N entries by default with a "Show all" toggle.

Visual style (matches Onyx aesthetic):
- Vertical gold-rule on the left
- Each entry: month/year in italic Playfair Display, title in regular, body in muted serif
- Type-badge in monospace JetBrains (e.g. `SHIPPED`, `JOINED`, `WROTE`)
- Thumbnail or link icon on the right where present

## Dashboard surface

`/dashboard/timeline`:
- Pending-review banner at top (GitHub auto-imports awaiting approval)
- List of all events with inline edit + delete + drag-to-reorder-within-month
- "Connect a source" panel: GitHub username input + RSS feed + X handle (v1)
- "Add manually" button — opens a small form with type/title/body/when

## Phasing

**Week 1 — schema + manual entry.**
- D1 migration for `timelineEvents`.
- `/dashboard/timeline` with manual add/edit/delete.
- Public render in <TimelineSection />.
- `buildProfileMemory()` integration.

**Week 2 — GitHub auto-fill.**
- "Connect GitHub" in /dashboard/timeline.
- Cron fetches events daily.
- AI rewrite + pending-review queue.
- One-click approve / trash.

**Week 3 — additional sources + polish.**
- RSS (catch blog posts), X handle (recent tweets above a threshold), Substack.
- Bulk approve.
- Timeline visibility toggles per entry.

## Open questions

1. **How far back to import?** Probably 2 years on first connect; user can rescue older items manually.
2. **Squashing related events.** Five commits to the same repo on the same day → one event ("Pushed 5 times to nanoGPT") not five separate ones.
3. **Per-entry privacy.** Some events feed the AI but don't render publicly (e.g. you tell the AI you moved to Lisbon, but you don't put a pin on the profile). `status: 'hidden'` covers this — hidden events still in the memory prompt, just not on the visible timeline.
4. **Agent variants.** For agent pages, types like `agent-deployed`, `agent-capability-added`, `agent-ownership-changed` need their own visual treatment — different badge colors, different blue-foil aesthetic from the Atlas-4 sample card.
5. **Editorial layer.** Should we let users write a one-line annotation on auto-imported events ("this was the week I almost gave up") that the AI weighs more heavily? Probably yes; cheap addition.

## What gets better immediately

- Chat "when" questions stop guessing.
- Encyclopedia gets a proper career arc.
- Newspaper can write dated prose ("Last quarter, X joined Y").
- Roast lands jokes about specific tenure lengths.
- Public profile gains substance without the user having to write more.

The bet: most users won't *write* a timeline. They might *approve* one a tool wrote for them. The auto-fill primitive is the whole product.
