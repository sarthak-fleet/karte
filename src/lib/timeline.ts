import type {
  TimelineEventSource,
  TimelineEventStatus,
  TimelineEventType,
} from '@/db/schema';

// Display label for each event type, used in the dashboard chips +
// public timeline badge.
export const TIMELINE_TYPE_LABELS: Record<TimelineEventType, string> = {
  'joined-company': 'Joined',
  'shipped-project': 'Shipped',
  'launched-product': 'Launched',
  'wrote-essay': 'Wrote',
  'spoke-at': 'Spoke at',
  'shipped-release': 'Released',
  'moved-to': 'Moved to',
  'life-event': 'Milestone',
  'agent-deployed': 'Deployed',
  'agent-capability-added': 'Capability +',
  'agent-ownership-changed': 'Ownership',
  custom: 'Note',
};

// Types selectable in the dashboard. Agent types are filtered out for
// person profiles when we add the pageType column.
export const TIMELINE_TYPE_OPTIONS: ReadonlyArray<{
  value: TimelineEventType;
  label: string;
}> = (Object.keys(TIMELINE_TYPE_LABELS) as TimelineEventType[]).map(
  (value) => ({
    value,
    label: TIMELINE_TYPE_LABELS[value],
  }),
);

// Parse a user-supplied when label into a sortable Date. Supports:
//   "2025" → Jan 1, 2025
//   "2025-03" → Mar 1, 2025
//   "Mar 2025" / "March 2025" → Mar 1, 2025
//   "2025-03-15" → Mar 15, 2025
//   ISO timestamps → as-is
// Falls back to today's date when nothing parses; the user can correct
// later. Never returns Invalid Date.
const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function parseWhenLabel(label: string): Date {
  const trimmed = (label ?? '').trim();
  if (!trimmed) return new Date();

  // Native parse first (catches ISO + most browser-recognized formats).
  const native = new Date(trimmed);
  if (!Number.isNaN(native.getTime())) return native;

  // YYYY or YYYY-MM
  const ym = trimmed.match(/^(\d{4})(?:-(\d{1,2}))?$/);
  if (ym) {
    const year = Number(ym[1]);
    const month = ym[2] ? Number(ym[2]) - 1 : 0;
    return new Date(year, month, 1);
  }

  // "March 2025" / "Mar 2025" / "Mar 15 2025"
  const monthWord = trimmed
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{1,2}\s*,?\s*)?(\d{4})$/);
  if (monthWord) {
    const month = MONTHS[monthWord[1]];
    const day = monthWord[2] ? parseInt(monthWord[2], 10) : 1;
    const year = Number(monthWord[3]);
    if (month !== undefined && !Number.isNaN(year)) {
      return new Date(year, month, day || 1);
    }
  }

  return new Date();
}

// Render the canonical-looking whenLabel from a Date when we have a
// timestamp but want to display a human form. Used in the GitHub
// auto-import flow (v2) where we get ISO dates.
export function formatWhenLabel(date: Date): string {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Re-export raw types for callers.
export type { TimelineEventSource, TimelineEventStatus, TimelineEventType };
