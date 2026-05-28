'use client';

// AI-component registry. The chat widget reads server-returned
// `{ type, props }` objects and renders them via the map below.
// Every component is gold-foil Onyx by default; the accent color
// flows from the page theme via the `--karte-accent` CSS variable
// so non-gold profiles (cyan, etc.) render their own tint without
// per-component CSS.

import Link from 'next/link';
import posthog from 'posthog-js';
import { useEffect, type ReactElement } from 'react';

import { ComponentBoundary } from '@/components/public/ai-components/component-boundary';
import { SafeImage } from '@/components/public/safe-image';
import type {
  AskAgainProps,
  AvailabilityChipProps,
  BookCallSlotProps,
  EssayLinkProps,
  HiringStatusProps,
  LocationCardProps,
  MetricCardProps,
  ProjectMiniProps,
  QuoteBlockProps,
  RateCardProps,
  RenderableComponent,
  StackListProps,
  TimelineSliceProps,
} from '@/lib/ai-components/types';

// ── Shared visual primitives ────────────────────────────────────────
// All components use these wrappers so spacing / corners / borders
// stay consistent across the catalog. accentColor falls back to the
// CSS var so a profile's theme overrides cleanly.

function ComponentCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[color:var(--karte-accent,#c4a46b)]/25 bg-black/30 p-4 backdrop-blur-sm ${className}`}
      style={{
        // Subtle inner glow + bottom-edge gold rule via background
        backgroundImage: `radial-gradient(140% 100% at 50% 0%, color-mix(in srgb, var(--karte-accent, #c4a46b) 6%, transparent) 0%, transparent 55%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 -bottom-px h-px"
        style={{
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--karte-accent, #c4a46b) 35%, transparent), transparent)`,
        }}
      />
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono text-[10px] uppercase tracking-[0.22em]"
      style={{ color: 'var(--karte-accent, #c4a46b)' }}
    >
      <span aria-hidden="true">◆</span> {children}
    </p>
  );
}

function ArrowLink({
  href,
  children,
  external = true,
  trackAs,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  trackAs?: { component: string; value?: string };
}) {
  const Tag = external ? 'a' : Link;
  const extProps = external
    ? { target: '_blank' as const, rel: 'noopener noreferrer' as const }
    : {};
  return (
    <Tag
      href={href}
      {...extProps}
      onClick={() => {
        if (trackAs) {
          try {
            posthog.capture('genui_component_clicked', trackAs);
          } catch {
            // best-effort
          }
        }
      }}
      className="group/al inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] transition"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--karte-accent, #c4a46b) 90%, white 10%), color-mix(in srgb, var(--karte-accent, #c4a46b) 70%, black 30%))',
        color: '#1a1206',
      }}
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover/al:translate-x-0.5">
        →
      </span>
    </Tag>
  );
}

function trackClick(component: string, value?: string) {
  try {
    posthog.capture('genui_component_clicked', { component, ...(value ? { value } : {}) });
  } catch {
    // best-effort
  }
}

// ── 1. AskAgain ─────────────────────────────────────────────────────
// Suggested follow-up question chips. Clicking submits the chip text
// as the next chat message via a CustomEvent the widget listens for.
function AskAgain({ suggestions }: AskAgainProps) {
  const items = (suggestions ?? []).filter((s) => s && s.trim()).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            try {
              posthog.capture('genui_component_clicked', {
                component: 'AskAgain',
                value: s,
              });
            } catch {
              // best-effort
            }
            window.dispatchEvent(
              new CustomEvent('karte:ask-again', { detail: { question: s } }),
            );
          }}
          className="rounded-full border px-3 py-1 text-[11.5px] transition hover:bg-white/[0.04]"
          style={{
            borderColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 30%, transparent)',
            color: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 100%, white 0%)',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── 2. AvailabilityChip ─────────────────────────────────────────────
const AVAILABILITY_DOT: Record<AvailabilityChipProps['status'], string> = {
  open: '#34d399',
  limited: '#f59e0b',
  closed: '#f87171',
};
function AvailabilityChip({ status, label }: AvailabilityChipProps) {
  const dot = AVAILABILITY_DOT[status] ?? AVAILABILITY_DOT.limited;
  const fallback =
    status === 'open' ? 'Open' : status === 'limited' ? 'Limited' : 'Closed';
  return (
    <div className="my-3 inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-black/30 px-3 py-1.5 text-[12px] font-medium text-white/85">
      <span
        aria-hidden="true"
        className="block h-2 w-2 rounded-full"
        style={{ backgroundColor: dot, boxShadow: `0 0 0 3px ${dot}22` }}
      />
      {label || fallback}
    </div>
  );
}

// ── 3. BookCallSlot ─────────────────────────────────────────────────
function BookCallSlot({ url, label, duration }: BookCallSlotProps) {
  if (!url) return null;
  return (
    <div className="my-3">
      <ComponentCard className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>Book a slot</Eyebrow>
          <p className="mt-1.5 text-[14.5px] font-semibold text-white">
            {label || 'Book a call'}
          </p>
          {duration && (
            <p className="mt-0.5 text-[12px] text-white/55">
              {duration} · async OK
            </p>
          )}
        </div>
        <ArrowLink href={url} trackAs={{ component: 'BookCallSlot' }}>
          Pick a time
        </ArrowLink>
      </ComponentCard>
    </div>
  );
}

// ── 4. EssayLink ────────────────────────────────────────────────────
function EssayLink({ title, url, excerpt, year }: EssayLinkProps) {
  return (
    <div className="my-3">
      <ComponentCard>
        <Eyebrow>Essay {year ? `· ${year}` : ''}</Eyebrow>
        <p className="mt-2 text-[15px] font-semibold leading-tight text-white">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            onClick={() => trackClick('EssayLink', title)}
          >
            {title}
          </a>
        </p>
        {excerpt && (
          <p className="mt-1.5 text-[13px] leading-[1.5] text-white/65 italic">
            {excerpt}
          </p>
        )}
      </ComponentCard>
    </div>
  );
}

// ── 5. HiringStatus ─────────────────────────────────────────────────
const HIRING_LABEL: Record<HiringStatusProps['status'], string> = {
  open: 'Open to full-time roles',
  'fractional-only': 'Fractional / advising only',
  'advising-only': 'Advising only',
  closed: 'Not looking right now',
};
function HiringStatus({ status, label }: HiringStatusProps) {
  return (
    <div className="my-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium"
      style={{
        borderColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 30%, transparent)',
        color: 'var(--karte-accent, #c4a46b)',
        backgroundColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 8%, transparent)',
      }}
    >
      <span aria-hidden="true">◆</span>
      {label || HIRING_LABEL[status] || 'Hiring status'}
    </div>
  );
}

// ── 6. LocationCard ─────────────────────────────────────────────────
function LocationCard({ city, timezone, travelStatus }: LocationCardProps) {
  return (
    <div className="my-3">
      <ComponentCard>
        <Eyebrow>Based in</Eyebrow>
        <p className="mt-2 text-[18px] font-semibold leading-tight text-white">
          {city}
        </p>
        {timezone && (
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
            {timezone}
          </p>
        )}
        {travelStatus && (
          <p className="mt-2 text-[13px] italic text-white/70">{travelStatus}</p>
        )}
      </ComponentCard>
    </div>
  );
}

// ── 7. MetricCard ───────────────────────────────────────────────────
function MetricCard({ value, label, context }: MetricCardProps) {
  return (
    <div className="my-3">
      <ComponentCard>
        <Eyebrow>{label}</Eyebrow>
        <p
          className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.02em]"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--karte-accent, #c4a46b) 30%, white 70%) 0%, var(--karte-accent, #c4a46b) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {value}
        </p>
        {context && (
          <p className="mt-1 text-[12px] italic text-white/55">{context}</p>
        )}
      </ComponentCard>
    </div>
  );
}

// ── 8. ProjectMini ──────────────────────────────────────────────────
function ProjectMini({ title, url, description, imageUrl }: ProjectMiniProps) {
  const inner = (
    <div className="flex items-start gap-3">
      <SafeImage
        src={imageUrl ?? null}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
        fallback={
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[18px]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 12%, transparent)',
              color: 'var(--karte-accent, #c4a46b)',
            }}
          >
            ◆
          </span>
        }
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold leading-tight text-white">
          {title}
        </p>
        {description && (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.5] text-white/65">
            {description}
          </p>
        )}
      </div>
      {url && (
        <span aria-hidden="true" className="shrink-0 text-white/40 transition group-hover:text-white/70">
          ↗
        </span>
      )}
    </div>
  );

  return (
    <div className="my-3">
      <ComponentCard className="group">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            onClick={() => trackClick('ProjectMini', title)}
          >
            {inner}
          </a>
        ) : (
          inner
        )}
      </ComponentCard>
    </div>
  );
}

// ── 9. QuoteBlock ───────────────────────────────────────────────────
function QuoteBlock({ quote, attribution }: QuoteBlockProps) {
  return (
    <figure className="my-3 border-l-2 pl-4"
      style={{ borderColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 40%, transparent)' }}
    >
      <blockquote
        className="text-[18px] leading-[1.4] italic"
        style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        “{quote}”
      </blockquote>
      {attribution && (
        <figcaption className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">
          — {attribution}
        </figcaption>
      )}
    </figure>
  );
}

// ── 10. RateCard ────────────────────────────────────────────────────
function RateCard({ tier, price, slots, cta, url }: RateCardProps) {
  return (
    <div className="my-3">
      <ComponentCard>
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>{tier}</Eyebrow>
          <p
            className="text-[26px] font-semibold leading-none tracking-[-0.02em]"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--karte-accent, #c4a46b) 30%, white 70%) 0%, var(--karte-accent, #c4a46b) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {price}
          </p>
        </div>
        {slots && (
          <p className="mt-2 text-[12.5px] italic text-white/70">{slots}</p>
        )}
        {url && (
          <div className="mt-3 flex justify-end">
            <ArrowLink href={url} trackAs={{ component: 'RateCard', value: tier }}>
              {cta || 'Book this slot'}
            </ArrowLink>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}

// ── 11. StackList ───────────────────────────────────────────────────
function StackList({ items, label }: StackListProps) {
  const cleaned = (items ?? []).filter((s) => s && s.trim()).slice(0, 12);
  if (cleaned.length === 0) return null;
  return (
    <div className="my-3">
      <ComponentCard>
        <Eyebrow>{label || 'Stack'}</Eyebrow>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cleaned.map((item, i) => (
            <span
              key={i}
              className="rounded-md border px-2 py-0.5 font-mono text-[11px] text-white/80"
              style={{
                borderColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 25%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 4%, transparent)',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </ComponentCard>
    </div>
  );
}

// ── 12. TimelineSlice ───────────────────────────────────────────────
function TimelineSlice({ events, heading }: TimelineSliceProps) {
  const items = (events ?? []).slice(0, 5);
  if (items.length === 0) return null;
  return (
    <div className="my-3">
      <ComponentCard>
        <Eyebrow>{heading || 'Recent'}</Eyebrow>
        <ol
          className="mt-3 space-y-2.5 border-l pl-4"
          style={{ borderColor: 'color-mix(in srgb, var(--karte-accent, #c4a46b) 25%, transparent)' }}
        >
          {items.map((e, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: 'var(--karte-accent, #c4a46b)' }}
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                {e.when}
              </p>
              <p className="mt-0.5 text-[13.5px] font-medium leading-tight text-white">
                {e.title}
                {e.where && (
                  <span className="ml-1.5 text-[12px] font-normal text-white/55">
                    @ {e.where}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ol>
      </ComponentCard>
    </div>
  );
}

// ── Tracked + boundary-wrapped wrapper ──────────────────────────────
// Every component goes through this: it fires a one-time PostHog
// 'genui_component_rendered' event on mount AND lives inside an error
// boundary so one bad component doesn't kill the chat bubble.
function TrackedComponent({
  type,
  children,
}: {
  type: RenderableComponent['type'];
  children: ReactElement;
}) {
  useEffect(() => {
    try {
      posthog.capture('genui_component_rendered', { component: type });
    } catch {
      // Analytics is best-effort.
    }
    // Fire once per mount; React compiler handles re-renders.
  }, [type]);
  return <ComponentBoundary componentType={type}>{children}</ComponentBoundary>;
}

// ── Registry ────────────────────────────────────────────────────────
// Discriminated dispatch — the chat widget calls renderComponent on
// each entry in the server's components[] array. Unknown types return
// null so an AI-invented component name doesn't crash the bubble.
export function renderComponent(c: RenderableComponent, key: number | string): ReactElement | null {
  const child = pickComponent(c);
  if (!child) return null;
  return (
    <TrackedComponent key={key} type={c.type}>
      {child}
    </TrackedComponent>
  );
}

function pickComponent(c: RenderableComponent): ReactElement | null {
  switch (c.type) {
    case 'AskAgain':
      return <AskAgain {...c.props} />;
    case 'AvailabilityChip':
      return <AvailabilityChip {...c.props} />;
    case 'BookCallSlot':
      return <BookCallSlot {...c.props} />;
    case 'EssayLink':
      return <EssayLink {...c.props} />;
    case 'HiringStatus':
      return <HiringStatus {...c.props} />;
    case 'LocationCard':
      return <LocationCard {...c.props} />;
    case 'MetricCard':
      return <MetricCard {...c.props} />;
    case 'ProjectMini':
      return <ProjectMini {...c.props} />;
    case 'QuoteBlock':
      return <QuoteBlock {...c.props} />;
    case 'RateCard':
      return <RateCard {...c.props} />;
    case 'StackList':
      return <StackList {...c.props} />;
    case 'TimelineSlice':
      return <TimelineSlice {...c.props} />;
    default:
      return null;
  }
}

// Export individual components for the Storybook preview page.
export {
  AskAgain,
  AvailabilityChip,
  BookCallSlot,
  EssayLink,
  HiringStatus,
  LocationCard,
  MetricCard,
  ProjectMini,
  QuoteBlock,
  RateCard,
  StackList,
  TimelineSlice,
};
