// Apply optional LayoutDirectives to the components emitted in one
// AI reply. Scoped to that message only — never mutates the page.
//
// hide: drop matching component types.
// filter: case-insensitive substring match across textual props.
// order: 'recency' uses year/when; 'impact' bubbles MetricCard; 'alphabetical' sorts by title-ish text.
// density: surfaced back to the caller for spacing decisions (handled at render time).
// mood: returns a small inline style block setting --karte-accent so the message takes on the requested feel.

import type { CSSProperties } from 'react';

import type { LayoutDirectives, RenderableComponent } from './types';

// Mood is treated as a soft accent shift. The chat widget already
// uses var(--karte-accent) throughout, so a single CSS variable
// scoped to the message wrapper is enough to repaint everything.
const MOOD_ACCENT: Record<NonNullable<LayoutDirectives['mood']>, string> = {
  serious: '#a8a29e',
  playful: '#f0abfc',
  minimal: '#d4d4d8',
  dark: '#71717a',
};

export interface AppliedLayout {
  components: RenderableComponent[];
  density: NonNullable<LayoutDirectives['density']> | 'comfortable';
  moodStyle: CSSProperties | undefined;
}

export function applyLayoutDirectives(
  components: RenderableComponent[],
  directives: LayoutDirectives | null | undefined,
): AppliedLayout {
  let out = components;

  if (directives?.hide && directives.hide.length > 0) {
    const hideSet = new Set(directives.hide.map((t) => t.toLowerCase()));
    out = out.filter((c) => !hideSet.has(c.type.toLowerCase()));
  }

  if (directives?.filter?.trim()) {
    const needle = directives.filter.toLowerCase();
    out = out.filter((c) => componentMatchesNeedle(c, needle));
  }

  if (directives?.order) {
    out = sortByOrder(out, directives.order);
  }

  const density = directives?.density ?? 'comfortable';
  const moodStyle: CSSProperties | undefined = directives?.mood
    ? ({
        ['--karte-accent' as string]: MOOD_ACCENT[directives.mood],
      } as CSSProperties)
    : undefined;

  return { components: out, density, moodStyle };
}

// Concatenate the textual fields the AI is most likely to express
// the topic in. Searched case-insensitively against the filter
// needle. AskAgain is special-cased to always pass so the visitor
// keeps a follow-up affordance even after filtering.
function componentMatchesNeedle(
  c: RenderableComponent,
  needle: string,
): boolean {
  if (c.type === 'AskAgain') return true;
  const haystack = collectText(c).toLowerCase();
  return haystack.includes(needle);
}

function collectText(c: RenderableComponent): string {
  switch (c.type) {
    case 'AskAgain':
      return c.props.suggestions.join(' ');
    case 'AvailabilityChip':
      return c.props.label ?? '';
    case 'BookCallSlot':
      return [c.props.label, c.props.duration].filter(Boolean).join(' ');
    case 'EssayLink':
      return [c.props.title, c.props.excerpt, c.props.year]
        .filter(Boolean)
        .join(' ');
    case 'HiringStatus':
      return c.props.label ?? c.props.status;
    case 'LocationCard':
      return [c.props.city, c.props.timezone, c.props.travelStatus]
        .filter(Boolean)
        .join(' ');
    case 'MetricCard':
      return [c.props.value, c.props.label, c.props.context]
        .filter(Boolean)
        .join(' ');
    case 'ProjectMini':
      return [c.props.title, c.props.description].filter(Boolean).join(' ');
    case 'QuoteBlock':
      return [c.props.quote, c.props.attribution].filter(Boolean).join(' ');
    case 'RateCard':
      return [c.props.tier, c.props.price, c.props.slots, c.props.cta]
        .filter(Boolean)
        .join(' ');
    case 'StackList':
      return [c.props.label, ...c.props.items].filter(Boolean).join(' ');
    case 'TimelineSlice':
      return [
        c.props.heading,
        ...c.props.events.map((e) => `${e.when} ${e.title} ${e.where ?? ''}`),
      ]
        .filter(Boolean)
        .join(' ');
  }
}

// AskAgain is always pinned to the bottom regardless of ordering, so
// the follow-up affordance stays predictable for visitors.
function sortByOrder(
  components: RenderableComponent[],
  order: NonNullable<LayoutDirectives['order']>,
): RenderableComponent[] {
  const askAgains = components.filter((c) => c.type === 'AskAgain');
  const rest = components.filter((c) => c.type !== 'AskAgain');

  rest.sort((a, b) => {
    if (order === 'alphabetical') {
      return titleish(a).localeCompare(titleish(b));
    }
    if (order === 'recency') {
      return recencyKey(b) - recencyKey(a);
    }
    // impact — Metric > Project > Timeline > everything else.
    return impactRank(a) - impactRank(b);
  });

  return [...rest, ...askAgains];
}

function titleish(c: RenderableComponent): string {
  switch (c.type) {
    case 'EssayLink':
    case 'ProjectMini':
      return c.props.title;
    case 'MetricCard':
      return c.props.label;
    case 'TimelineSlice':
      return c.props.heading ?? '';
    case 'QuoteBlock':
      return c.props.quote.slice(0, 40);
    case 'RateCard':
      return c.props.tier;
    case 'StackList':
      return c.props.label ?? '';
    case 'LocationCard':
      return c.props.city;
    case 'HiringStatus':
      return c.props.label ?? c.props.status;
    case 'AvailabilityChip':
      return c.props.label ?? c.props.status;
    case 'BookCallSlot':
      return c.props.label ?? '';
    case 'AskAgain':
      return '';
  }
}

// Extract a year-ish number from props for recency sorting. Anything
// without a year is treated as oldest so it sinks.
function recencyKey(c: RenderableComponent): number {
  const text = collectText(c);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function impactRank(c: RenderableComponent): number {
  switch (c.type) {
    case 'MetricCard':
      return 0;
    case 'ProjectMini':
      return 1;
    case 'TimelineSlice':
      return 2;
    case 'RateCard':
      return 3;
    case 'EssayLink':
      return 4;
    default:
      return 5;
  }
}
