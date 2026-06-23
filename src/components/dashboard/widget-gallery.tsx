'use client';

import {
  linkCardVariants,
  projectCardVariants,
} from '@/components/public/widgets';
import { PAGE_SECTION_TYPES } from '@/lib/page-sections';

const sampleLinkData = {
  id: 'preview',
  title: 'Read the latest essay',
  url: 'https://example.com',
  icon: '✍️',
  imageUrl:
    'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&q=80',
  body: 'A short, one-line description that adds context the title can’t carry.',
};

const sampleProjectData = {
  id: 'preview',
  title: 'SaaS Maker',
  url: 'https://example.com',
  description:
    'A workflow tool for indie SaaS builders — context capture, AI-assisted decisions, and one-click publishing.',
  imageUrl:
    'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&q=80',
};

function VariantCard({
  id,
  size,
  budget,
  bestFor,
  requires,
  children,
}: {
  id: string;
  size: string;
  budget: string;
  bestFor: string;
  requires: ReadonlyArray<string>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            {id}
          </p>
          <p className="mt-1 text-[13px] font-semibold capitalize text-karte-text">
            {size} variant
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
            budget === 'high'
              ? 'bg-karte-accent/[0.10] text-karte-accent-soft'
              : budget === 'medium'
                ? 'bg-white/[0.06] text-karte-text-2'
                : 'bg-white/[0.03] text-karte-text-4'
          }`}
        >
          {budget} weight
        </span>
      </div>
      <p className="text-[12px] leading-[1.5] text-karte-text-3">{bestFor}</p>
      <p className="font-mono text-[10px] text-karte-text-4">
        needs: {requires.join(', ')}
      </p>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  children,
  description,
}: {
  eyebrow: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        <span className="text-karte-accent/80">·</span> {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-karte-text">
        {children}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-[13px] leading-[1.55] text-karte-text-3">
          {description}
        </p>
      )}
    </div>
  );
}

export function WidgetGallery() {
  const ctx = { accentColor: '#67e8f9', slug: 'demo' };

  return (
    <div className="space-y-14">
      {/* ── LINK VARIANTS ────────────────────────────────────── */}
      <section>
        <SectionTitle
          eyebrow="Links"
          description="The smallest unit on a profile — a stack of these is the link-in-bio's bread. Pick a size depending on how much weight a link should carry: line is scannable, hero is the marquee."
        >
          Link widgets
        </SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {linkCardVariants.map((variant) => (
            <VariantCard
              key={variant.id}
              id={variant.id}
              size={variant.size}
              budget={variant.budget}
              bestFor={variant.bestFor}
              requires={variant.requires as ReadonlyArray<string>}
            >
              {variant.render(sampleLinkData, ctx)}
            </VariantCard>
          ))}
        </div>
      </section>

      {/* ── PROJECT VARIANTS ─────────────────────────────────── */}
      <section>
        <SectionTitle
          eyebrow="Projects"
          description="Portfolio entries. Use line when projects are similar and the list is the point; use hero for one marquee piece you want every visitor to see first."
        >
          Project widgets
        </SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {projectCardVariants.map((variant) => (
            <VariantCard
              key={variant.id}
              id={variant.id}
              size={variant.size}
              budget={variant.budget}
              bestFor={variant.bestFor}
              requires={variant.requires as ReadonlyArray<string>}
            >
              {variant.render(sampleProjectData, ctx)}
            </VariantCard>
          ))}
        </div>
      </section>

      {/* ── SECTION TYPES ────────────────────────────────────── */}
      <section>
        <SectionTitle
          eyebrow="Sections"
          description="Heterogeneous content blocks. Each section type has a distinct visual treatment driven by its purpose. Size variants per type are on the roadmap — for now there's one canonical shape per type."
        >
          Section widgets
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAGE_SECTION_TYPES.map((type) => (
            <div key={type.value} className="rounded-2xl bg-white/[0.02] p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
                section.{type.value}
              </p>
              <p className="mt-1.5 text-[14px] font-semibold text-karte-text">
                {type.label}
              </p>
              <p className="mt-2 text-[12px] leading-[1.55] text-karte-text-3">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROADMAP ──────────────────────────────────────────── */}
      <section>
        <SectionTitle eyebrow="Roadmap">Coming next</SectionTitle>
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <ul className="space-y-2 font-mono text-[12px] text-karte-text-3">
            <li>
              <span className="text-karte-text-2">section.*</span> — size
              variants per section type (compact / standard / featured)
            </li>
            <li>
              <span className="text-karte-text-2">layoutPlan storage</span> —
              Drizzle column on <code className="text-karte-text-2">pages</code>{' '}
              so AI Revamp output persists
            </li>
            <li>
              <span className="text-karte-text-2">LayoutRenderer</span> — swap
              the profile page&apos;s ad-hoc rendering for plan-driven output
            </li>
            <li>
              <span className="text-karte-text-2">Drag-and-drop override</span>{' '}
              — manual variant swap per item from the dashboard
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
