'use client';

// Storybook-style preview of every AI-emittable component, with the
// sample props each render expects. Internal-only — accessed via
// /dashboard/components. Useful for sanity-checking the visual + for
// pasting screenshots into Slack when debugging the AI's picks.

import { useState } from 'react';

import {
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
  renderComponent,
  StackList,
  TimelineSlice,
} from '@/components/public/ai-components/registry';
import { applyLayoutDirectives } from '@/lib/ai-components/layout';
import type { LayoutDirectives, RenderableComponent } from '@/lib/ai-components/types';

const ACCENT_PRESETS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Gold (default)', value: '#c4a46b' },
  { label: 'Cyan', value: '#67e8f9' },
  { label: 'Violet', value: '#a78bfa' },
  { label: 'Rose', value: '#fb7185' },
  { label: 'Emerald', value: '#34d399' },
];

interface StoryProps {
  name: string;
  notes?: string;
  children: React.ReactNode;
}

function Story({ name, notes, children }: StoryProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.18em] text-karte-text-2">
          {name}
        </h2>
        {notes && (
          <p className="text-[11.5px] text-karte-text-4">{notes}</p>
        )}
      </header>
      <div className="rounded-xl bg-black/40 p-4">{children}</div>
    </section>
  );
}

export function ComponentsStorybook() {
  const [accent, setAccent] = useState(ACCENT_PRESETS[0].value);

  return (
    <div
      style={{ ['--karte-accent' as never]: accent } as React.CSSProperties}
    >
      {/* Accent picker */}
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          Accent
        </span>
        {ACCENT_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setAccent(p.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${
              accent === p.value
                ? 'border-white/30 bg-white/[0.06] text-karte-text'
                : 'border-white/10 text-karte-text-3 hover:text-karte-text'
            }`}
          >
            <span
              aria-hidden="true"
              className="block h-3 w-3 rounded-full"
              style={{ backgroundColor: p.value }}
            />
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <Story name="AskAgain" notes="Follow-up question chips">
          <AskAgain
            suggestions={[
              "What's your stack?",
              'Are you hiring?',
              'Past clients?',
              "What's TinyGPT?",
            ]}
          />
        </Story>

        <Story name="AvailabilityChip" notes="Status pill — open / limited / closed">
          <div className="flex flex-wrap gap-3">
            <AvailabilityChip status="open" />
            <AvailabilityChip
              status="limited"
              label="One slot open in June"
            />
            <AvailabilityChip status="closed" label="Booked through Q3" />
          </div>
        </Story>

        <Story name="BookCallSlot" notes="Calendar CTA">
          <BookCallSlot
            url="https://cal.com/sarthak"
            label="Book a 20-min intro"
            duration="20 min"
          />
        </Story>

        <Story name="EssayLink" notes="Cite or recommend a post">
          <EssayLink
            title="How to Do Great Work"
            url="http://www.paulgraham.com/greatwork.html"
            excerpt="Choose a field you have a natural aptitude for, that interests you most, and offers the most scope to do great work."
            year="2023"
          />
        </Story>

        <Story name="HiringStatus" notes="What the owner is open to">
          <div className="flex flex-wrap gap-3">
            <HiringStatus status="open" />
            <HiringStatus status="fractional-only" />
            <HiringStatus status="advising-only" />
            <HiringStatus status="closed" />
          </div>
        </Story>

        <Story name="LocationCard" notes="City + tz + travel posture">
          <LocationCard
            city="Bangalore"
            timezone="GMT+5:30"
            travelStatus="Mostly Bangalore, in SF every Q2."
          />
        </Story>

        <Story name="MetricCard" notes="One big number">
          <MetricCard
            value="200k DAU"
            label="Real-time market pipeline scaled to"
            context="Front.Page, 2023"
          />
        </Story>

        <Story name="ProjectMini" notes="Single project, inline">
          <ProjectMini
            title="TinyGPT"
            description="0.8M-param transformer that trains and runs in the browser via PyTorch → WebAssembly + WebGPU."
            url="https://github.com/sarthak-fleet/tinygpt"
            imageUrl={null}
          />
        </Story>

        <Story name="QuoteBlock" notes="Signature pull-quote">
          <QuoteBlock
            quote="It's the stuff around the happy path that matters — timeouts, retries, idempotency, downstream failures."
            attribution="Sarthak, on engineering"
          />
        </Story>

        <Story name="RateCard" notes="Pricing + booking">
          <RateCard
            tier="4-week shipping sprint"
            price="$18k"
            slots="One slot open in June"
            url="https://cal.com/sarthak"
            cta="Book June"
          />
        </Story>

        <Story name="StackList" notes="Tech / tool tokens">
          <StackList
            label="Backend"
            items={['Go', 'Node.js', 'Python', 'Kafka', 'Temporal', 'PostgreSQL', 'Redis', 'ClickHouse']}
          />
        </Story>

        <Story name="TimelineSlice" notes="N recent events, scoped">
          <TimelineSlice
            heading="Recent ships"
            events={[
              { when: 'May 2026', title: 'Released TinyGPT', where: undefined },
              { when: 'Feb 2026', title: 'Shipped free-ai', where: 'CF Workers' },
              { when: 'Nov 2025', title: 'Built CodeVetter', where: undefined },
              { when: 'Feb 2025', title: 'Joined VaultWealth', where: 'Peak XV' },
            ]}
          />
        </Story>

        <SizeVariantStories />

        <LayoutDirectiveSandbox />
      </div>
    </div>
  );
}

// ── Size variants ───────────────────────────────────────────────────
// Demonstrates the sm / md / lg knob the AI can set per component
// (per visitor sizing intent like "bigger project cards"). Rendered
// in a 3-column grid so all three are visible side-by-side.
function SizeVariantStories() {
  const sizes = ['sm', 'md', 'lg'] as const;
  return (
    <>
      <Story name="ProjectMini · sizes" notes="Visitor: 'bigger project cards'">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sizes.map((s) => (
            <div key={s}>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-karte-text-4">{s}</p>
              <ProjectMini
                title="TinyGPT"
                description="0.8M-param transformer in the browser via PyTorch → WASM + WebGPU."
                url="https://github.com/sarthak-fleet/tinygpt"
                imageUrl={null}
                size={s}
              />
            </div>
          ))}
        </div>
      </Story>

      <Story name="EssayLink · sizes" notes="sm hides the excerpt (list-row feel)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sizes.map((s) => (
            <div key={s}>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-karte-text-4">{s}</p>
              <EssayLink
                title="How to Do Great Work"
                url="http://www.paulgraham.com/greatwork.html"
                excerpt="Choose a field with natural aptitude, deep interest, and scope to do great work."
                year="2023"
                size={s}
              />
            </div>
          ))}
        </div>
      </Story>

      <Story name="MetricCard · sizes" notes="Big-number scaling for emphasis">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sizes.map((s) => (
            <div key={s}>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-karte-text-4">{s}</p>
              <MetricCard value="200k DAU" label="Peak users" context="Front.Page, 2023" size={s} />
            </div>
          ))}
        </div>
      </Story>

      <Story name="TimelineSlice · sizes" notes="sm caps at 3 events; lg allows 6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sizes.map((s) => (
            <div key={s}>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-karte-text-4">{s}</p>
              <TimelineSlice
                heading="Recent"
                events={[
                  { when: 'May 2026', title: 'Released TinyGPT' },
                  { when: 'Feb 2026', title: 'Shipped free-ai', where: 'CF' },
                  { when: 'Nov 2025', title: 'Built CodeVetter' },
                  { when: 'Feb 2025', title: 'Joined VaultWealth' },
                  { when: 'Oct 2024', title: 'Open-sourced Karte' },
                  { when: 'Jul 2024', title: 'Talk at AI Tinkerers' },
                ]}
                size={s}
              />
            </div>
          ))}
        </div>
      </Story>
    </>
  );
}

// ── Layout directive sandbox ────────────────────────────────────────
// Drives the same array of components through applyLayoutDirectives
// with toggleable directives so you can see hide / filter / order /
// density / mood react in real time, without needing the AI to round
// trip. Mirrors what the chat widget does at render time.
const SANDBOX_COMPONENTS: RenderableComponent[] = [
  {
    type: 'ProjectMini',
    props: {
      title: 'TinyGPT',
      description: 'AI in the browser — 0.8M-param transformer, WASM + WebGPU.',
      url: 'https://github.com/sarthak-fleet/tinygpt',
      imageUrl: null,
    },
  },
  {
    type: 'ProjectMini',
    props: {
      title: 'LinkChat',
      description: 'Profile site builder, not AI-focused.',
      url: 'https://karte.cc',
      imageUrl: null,
    },
  },
  {
    type: 'EssayLink',
    props: {
      title: 'How to Do Great Work',
      url: 'http://www.paulgraham.com/greatwork.html',
      excerpt: 'On finding aptitude and scope.',
      year: '2023',
    },
  },
  {
    type: 'EssayLink',
    props: {
      title: 'Distributed systems are hard',
      url: 'https://example.com/dist',
      excerpt: 'Not an AI essay — just systems thinking.',
      year: '2018',
    },
  },
  {
    type: 'TimelineSlice',
    props: {
      heading: 'Recent ships',
      events: [
        { when: 'May 2026', title: 'Released TinyGPT' },
        { when: 'Feb 2026', title: 'Shipped free-ai' },
      ],
    },
  },
  {
    type: 'MetricCard',
    props: { value: '200k DAU', label: 'Peak users', context: 'Front.Page' },
  },
  {
    type: 'AskAgain',
    props: { suggestions: ['Tell me more', 'How can I reach you?'] },
  },
];

function LayoutDirectiveSandbox() {
  const [directives, setDirectives] = useState<LayoutDirectives>({});
  const applied = applyLayoutDirectives(SANDBOX_COMPONENTS, directives);

  const gapClass =
    applied.density === 'compact'
      ? 'mt-1.5 space-y-1.5'
      : applied.density === 'magazine'
      ? 'mt-3 space-y-4'
      : 'mt-2 space-y-2';

  return (
    <Story name="Layout directives sandbox" notes="Apply directives without an AI round trip">
      <div className="space-y-4">
        <SandboxControls directives={directives} setDirectives={setDirectives} />
        <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
            Output · {applied.components.length} component{applied.components.length === 1 ? '' : 's'}
          </p>
          <div className={gapClass} style={applied.moodStyle}>
            {applied.components.map((c, i) => renderComponent(c, i, i))}
          </div>
        </div>
      </div>
    </Story>
  );
}

function SandboxControls({
  directives,
  setDirectives,
}: {
  directives: LayoutDirectives;
  setDirectives: (d: LayoutDirectives) => void;
}) {
  const densities = ['comfortable', 'compact', 'magazine'] as const;
  const orders = ['none', 'recency', 'impact', 'alphabetical'] as const;
  const moods = ['default', 'serious', 'playful', 'minimal', 'dark'] as const;
  const hideOptions = ['ProjectMini', 'EssayLink', 'TimelineSlice', 'MetricCard'] as const;

  function toggleHide(type: string) {
    const cur = directives.hide ?? [];
    const next = cur.includes(type) ? cur.filter((t) => t !== type) : [...cur, type];
    setDirectives({ ...directives, hide: next.length ? next : undefined });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ControlRow label="Density">
        {densities.map((d) => (
          <Chip
            key={d}
            active={(directives.density ?? 'comfortable') === d}
            onClick={() =>
              setDirectives({ ...directives, density: d === 'comfortable' ? undefined : d })
            }
          >
            {d}
          </Chip>
        ))}
      </ControlRow>
      <ControlRow label="Order">
        {orders.map((o) => (
          <Chip
            key={o}
            active={(directives.order ?? 'none') === o}
            onClick={() =>
              setDirectives({ ...directives, order: o === 'none' ? undefined : o })
            }
          >
            {o}
          </Chip>
        ))}
      </ControlRow>
      <ControlRow label="Mood">
        {moods.map((m) => (
          <Chip
            key={m}
            active={(directives.mood ?? 'default') === m}
            onClick={() =>
              setDirectives({ ...directives, mood: m === 'default' ? undefined : m })
            }
          >
            {m}
          </Chip>
        ))}
      </ControlRow>
      <ControlRow label="Hide types">
        {hideOptions.map((t) => (
          <Chip
            key={t}
            active={(directives.hide ?? []).includes(t)}
            onClick={() => toggleHide(t)}
          >
            {t}
          </Chip>
        ))}
      </ControlRow>
      <ControlRow label="Filter (substring)">
        <input
          type="text"
          placeholder="e.g. AI"
          value={directives.filter ?? ''}
          onChange={(e) =>
            setDirectives({ ...directives, filter: e.target.value || undefined })
          }
          className="rounded-md border border-white/[0.12] bg-black/40 px-2 py-1 text-[12px] text-karte-text outline-none focus:border-white/30"
        />
      </ControlRow>
    </div>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
        active
          ? 'border-white/30 bg-white/[0.08] text-karte-text'
          : 'border-white/10 text-karte-text-3 hover:text-karte-text'
      }`}
    >
      {children}
    </button>
  );
}
