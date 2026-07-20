// Shared types for the Generative UI system.
// See docs/plans/generative-ui.md for the vision + phasing.
//
// A widget variant is a single visual treatment for a content type. The
// same data (a link, a project, a section) can be rendered in multiple
// variants — line, square, wide, hero — chosen either by the user, by
// a default-layout builder, or eventually by the AI Revamp assistant.

import type { ReactNode } from 'react';

type WidgetSize =
  /** 1-row, slim — title + maybe icon. Cheapest visual weight. */
  | 'line'
  /** 1×1 tile — title + thumbnail. Best for content with imagery. */
  | 'square'
  /** 2×1 — title + thumb + 1-line body. Balanced default. */
  | 'wide'
  /** 1×2 — title + body + cta stacked. Reading-oriented. */
  | 'tall'
  /** Full-bleed showcase. Use sparingly — high visual weight. */
  | 'hero';

/**
 * AI budgeting hint. The Revamp assistant uses this to keep a row visually
 * balanced — e.g. one `high` per row, or three `medium`s.
 */
type WidgetBudget = 'low' | 'medium' | 'high';

type WidgetResourceType = 'link' | 'project' | 'section' | 'info-block';

/**
 * Per-render context. Everything a variant might need that isn't on the
 * data itself: the page's accent color, the slug (for analytics + links),
 * any locale flags etc.
 */
export interface WidgetRenderContext {
  accentColor: string;
  slug: string;
}

/**
 * A single visual treatment for a content type. Pure presentation — the
 * caller has already resolved the data + render context.
 */
export interface WidgetVariant<TData> {
  /** Stable id, used in stored layout plans. e.g. 'link-square'. */
  id: string;
  /** Content type this variant renders. */
  resourceType: WidgetResourceType;
  /** Visual shape, used by the AI for spatial planning. */
  size: WidgetSize;
  /** Visual-weight budget, used for AI row balancing. */
  budget: WidgetBudget;
  /** Human-readable hint the AI sees: when is this variant a good pick? */
  bestFor: string;
  /** Fields on TData that must be present + non-empty for this variant. */
  requires: ReadonlyArray<keyof TData>;
  /** Render function. */
  render: (data: TData, ctx: WidgetRenderContext) => ReactNode;
}

/**
 * Stored layout. Lives on `pages.layoutPlan` (JSON, nullable).
 * `null` → use `buildDefaultPlan()` which mirrors the legacy rendering.
 */
interface LayoutPlan {
  version: 1;
  rows: LayoutRow[];
}

interface LayoutRow {
  /** Cells in this row. Total `cols` should sum to <=12. */
  cells: LayoutCell[];
}

interface LayoutCell {
  /** Matches WidgetVariant.id. */
  widgetVariantId: string;
  /** Foreign key into the resource type's table. */
  resourceId: string;
  resourceType: WidgetResourceType;
  /** 12-grid columns this cell occupies. Typically 3, 4, 6, or 12. */
  cols: number;
}
