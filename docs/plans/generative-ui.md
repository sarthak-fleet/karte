# Plan — Generative UI

**Vision.** The AI Revamp assistant becomes a first-class authoring surface
that doesn't just pick a color theme — it picks how the entire profile is
*arranged*. Each piece of content (link, project, section, info-block) can
render in multiple visual shapes, with the AI choosing per-item what
treatment fits the user's content and goals.

Mental model: closer to Beacons.ai's bento blocks or Cal.com's event-type
sizing than to "pick a theme." The profile layout becomes editable data,
not hand-coded JSX.

---

## Status

Phase 1 (the widget-variant contract + first LinkCard family) is in
progress. Everything else is paper.

---

## The widget primitive contract

Each renderable content type declares one or more **variants** — different
visual shapes the same data can take. Variants are pure presentation:
identical data, different layouts.

```ts
// src/lib/widget-types.ts

export type WidgetSize =
  | 'line'   // 1-row, slim — link text + maybe icon
  | 'square' // 1x1 tile — title + thumbnail
  | 'wide'   // 2x1 — title + thumb + 1-line body
  | 'tall'   // 1x2 — title + body + cta stacked
  | 'hero';  // full-bleed showcase — image-led

export type WidgetBudget = 'low' | 'medium' | 'high';

export interface WidgetVariant<TData> {
  id: string;              // 'link-line' | 'link-square' | …
  size: WidgetSize;
  budget: WidgetBudget;    // visual-weight cost; AI uses to balance the page
  render: (data: TData, ctx: RenderContext) => ReactNode;
  bestFor: string;         // human-readable hint, fed to the AI prompt
  requires: Array<keyof TData>;  // minimum data fields for this variant to look good
}

export interface RenderContext {
  accentColor: string;
  slug: string;            // for analytics + trackable links
}
```

### Initial variant catalog

| Content type | Variants | Notes |
|---|---|---|
| Link | `line`, `square`, `wide`, `hero` | Phase 1. Most users have a stack of links — variant choice is highest-leverage. |
| Project | `line`, `square`, `wide`, `hero` | Phase 3. Image-bearing projects benefit from larger variants. |
| Section | `card`, `wide`, `full` | Phase 3. Less variation, mostly text content. |
| Info-block | `chip`, `card` | Phase 4. Small structured facts (location, role, languages). |

---

## The layout plan — data shape

A profile's arrangement is stored on the `pages` row as a JSON column:

```ts
type LayoutPlan = {
  version: 1;
  rows: LayoutRow[];
};

type LayoutRow = {
  // Each row has a 12-col grid budget. Widgets declare how many cols they take.
  cells: LayoutCell[];
};

type LayoutCell = {
  widgetVariantId: string;       // 'link-square'
  resourceId: string;             // links.id / projects.id / etc.
  resourceType: 'link' | 'project' | 'section' | 'info-block';
  cols: number;                   // 12-grid units (typically 3, 4, 6, or 12)
};
```

Storage: new nullable column `pages.layoutPlan` (JSON). Null = default
fallback layout (current behavior — all links as `line`, all projects as
`wide`, etc.).

Lookups: `getFullPageData(slug)` returns the parsed plan if present.

---

## The AI Revamp output upgrade

The `/api/pages/[pageId]/revamp` endpoint currently outputs a theme
(colors + preset). Extend it to also emit a `LayoutPlan`:

```ts
type RevampPlan = {
  themePresetId?: string;
  customColors?: { gradientFrom: string; gradientTo: string; accentColor: string };
  layoutPlan?: LayoutPlan;       // ← new
  // …existing fields
};
```

**AI prompt addition:** include each user-resource's data + a description
of every available variant (id + bestFor + budget), plus the current
content inventory. Ask the model to produce a layout that's visually
balanced (don't pile six heroes in a row) and matches the user's intent
(creator-portfolio vs business-card vs link-hub).

System-prompt budget constraint: total budget across a row stays under a
threshold (e.g. one `high` + two `low`, or three `medium`s).

---

## Renderer

A new top-level `<LayoutRenderer>` component on `/[slug]` reads the plan
and resolves each cell to its variant component. Falls back to the
current default-layout behavior when `layoutPlan` is null.

```tsx
<LayoutRenderer
  plan={page.layoutPlan ?? buildDefaultPlan(page, links, projects, sections)}
  resources={{ links, projects, sections, infoBlocks }}
  ctx={{ accentColor, slug }}
/>
```

`buildDefaultPlan()` is the migration-friendly default: treat every link
as `line`, every project as `wide`, every section as `card`. Existing
profiles render exactly as they do today, with no DB change.

---

## Phases

### Phase 1 — Contract + LinkCard variants (this session)

- [ ] `src/lib/widget-types.ts` — types only, no DB
- [ ] `src/components/public/widgets/link-card-variants.tsx` — four
      variants of LinkCard
- [ ] `src/components/public/widgets/index.ts` — variant registry
- [ ] No AI yet, no plan storage yet. Just the building blocks.

### Phase 2 — Plan storage + renderer (next)

- [ ] DB migration: add `pages.layoutPlan` JSON column (nullable)
- [ ] `buildDefaultPlan()` so unmigrated rows render identically
- [ ] `<LayoutRenderer>` that consumes the plan + variant registry
- [ ] `getFullPageData` returns plan
- [ ] Profile page swaps current ad-hoc rendering for `<LayoutRenderer>`

### Phase 3 — Expand widget families

- [ ] ProjectCard variants (line / square / wide / hero)
- [ ] SectionCard variants
- [ ] InfoBlock variants (chip / card)

### Phase 4 — AI integration

- [ ] Extend RevampPlan with `layoutPlan`
- [ ] Update revamp route to include variant catalog + budgets in prompt
- [ ] Validate AI output against the contract (reject invalid sizes,
      cells exceeding row budget, missing required data)
- [ ] Apply on user "Apply Design"

### Phase 5 — Manual override editor

- [ ] Dashboard surface (likely `/dashboard/appearance` extension)
- [ ] Drag-and-drop variant swap per resource
- [ ] Preview pane next to the editor
- [ ] Save → updates `pages.layoutPlan`

---

## Open questions to resolve at execution time

- **Granularity of cells**: is a 12-column grid the right primitive, or
  should it be more flexible (CSS subgrid, fractional)? Start with 12-col,
  refine if it cramps designs.
- **Mobile collapse**: how does a 4-col `link-square` render at 320px wide?
  Each variant probably needs a `mobileFallback: WidgetSize` hint.
- **Variant catalog discoverability for the AI**: should the AI see every
  variant's full description in every prompt? Token cost vs flexibility.
- **Migration**: when does an existing profile *first* get a generated
  layout — on first user click of "AI Revamp" or auto on enable? Probably
  manual at first to avoid surprises.
- **Cache invalidation**: layout changes need to bust the edge cache for
  `/[slug]`. `revalidateTag()` once we set up tags.
- **Theming intersects with layout**: a `hero` variant probably looks
  different per theme preset. Variants may need theme-aware tokens, not
  hardcoded styles. Worth defining a shared style system before Phase 3.

---

## Why this is worth doing

Most link-in-bio products treat layout as a fixed template. Karte's
existing differentiator is that the *content* is AI-generated (chat,
encyclopedia, newspaper, roast). Extending the AI to also pick the
arrangement makes the whole product feel generative end-to-end — not just
"AI-powered" as a marketing line.

Concrete user benefit: a creator with 8 links + 2 projects gets a
different visual than a job-hunter with 1 résumé link + 3 case studies.
Today they both get the same template. After this lands, the AI Revamp
button is the canonical authoring action, not a side feature.
