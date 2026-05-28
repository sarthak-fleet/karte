// Vertical-rule timeline render. Used on the public profile to show
// dated events. Receives an already-filtered, sorted list of events
// (server fetches + filters by status='published'). The Onyx-style
// gold rule on the left + monospace dates match the rest of the
// brand system.

import type { TimelineEventType } from '@/db/schema';
import { TIMELINE_TYPE_LABELS } from '@/lib/timeline';

interface TimelineEventDisplay {
  id: string;
  type: TimelineEventType;
  title: string;
  body: string | null;
  whereLabel: string | null;
  link: string | null;
  whenLabel: string;
}

interface TimelineSectionProps {
  events: ReadonlyArray<TimelineEventDisplay>;
  accentColor: string;
  /** Heading shown above the timeline. Default 'Timeline'. */
  heading?: string;
}

export function TimelineSection({
  events,
  accentColor,
  heading = 'Timeline',
}: TimelineSectionProps) {
  if (events.length === 0) return null;

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-7">
      <p
        className="text-[10.5px] font-medium uppercase tracking-[0.22em]"
        style={{ color: accentColor }}
      >
        ◆ {heading}
      </p>
      <ol
        className="mt-6 space-y-6 border-l-2 pl-6"
        style={{ borderColor: `${accentColor}33` }}
      >
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.7rem] top-1.5 h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 0 3px rgba(10, 8, 5, 1), 0 0 0 4px ${accentColor}40`,
              }}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-karte-text-4">
                {event.whenLabel}
                <span className="mx-2 opacity-50">·</span>
                <span style={{ color: accentColor }}>
                  {TIMELINE_TYPE_LABELS[event.type] || 'Note'}
                </span>
              </p>
            </div>
            <h3 className="mt-1.5 text-[16px] font-semibold leading-tight text-karte-text sm:text-[17px]">
              {event.link ? (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:underline"
                  data-track-type="timeline"
                  data-track-id={event.id}
                  data-track-label={event.title}
                >
                  {event.title}
                </a>
              ) : (
                event.title
              )}
              {event.whereLabel && (
                <span className="ml-2 text-[14px] font-normal text-karte-text-3">
                  @ {event.whereLabel}
                </span>
              )}
            </h3>
            {event.body && (
              <p className="mt-1.5 max-w-2xl text-[13.5px] leading-[1.55] text-karte-text-3">
                {event.body}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
