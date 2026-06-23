import { SafeImage } from '@/components/public/safe-image';
import { hostnameFromUrl } from '@/lib/hostname';
import type { WidgetVariant } from '@/lib/widget-types';

// Data shape consumed by every ProjectCard variant. Mirrors the columns
// stored on `projects` so the AI renderer can drop a project row into any
// shape without per-variant data massaging.
export interface ProjectCardData {
  id: string;
  title: string;
  url: string;
  description: string;
  imageUrl?: string | null;
}

/**
 * `project-line` — slim 1-row. Title + arrow, no image. Use when you have
 * many projects and want them to read as a list rather than a gallery.
 */
const lineVariant: WidgetVariant<ProjectCardData> = {
  id: 'project-line',
  resourceType: 'project',
  size: 'line',
  budget: 'low',
  bestFor:
    'Project in a long list. Title-only weight, no thumbnail. Good when projects share a similar shape and the list is what matters.',
  requires: ['title', 'url'],
  render: (data, ctx) => (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      data-track-type="project"
      data-track-id={data.id || data.url}
      data-track-label={data.title}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.05]"
      style={
        ctx.accentColor ? { borderColor: `${ctx.accentColor}28` } : undefined
      }
    >
      <span className="truncate text-base font-semibold text-karte-text">
        {data.title}
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5"
      >
        ↗
      </span>
    </a>
  ),
};

/**
 * `project-square` — 1×1 tile. Image-led with title overlay or compact
 * card without one. Stand-out shape for a portfolio piece.
 */
const squareVariant: WidgetVariant<ProjectCardData> = {
  id: 'project-square',
  resourceType: 'project',
  size: 'square',
  budget: 'medium',
  bestFor:
    'Visual project with a hero image. Reads as a portfolio tile. Without an image it falls back to title + accent gradient — usable but `project-line` is cleaner in that case.',
  requires: ['title', 'url'],
  render: (data, ctx) => (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      data-track-type="project"
      data-track-id={data.id || data.url}
      data-track-label={data.title}
      className="group relative flex aspect-square w-full flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/[0.18]"
      style={
        ctx.accentColor ? { borderColor: `${ctx.accentColor}28` } : undefined
      }
    >
      <SafeImage
        src={data.imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        fallback={
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${ctx.accentColor || '#67e8f9'}33, transparent 70%)`,
            }}
          />
        }
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <span className="relative truncate text-base font-semibold leading-tight text-white">
        {data.title}
      </span>
    </a>
  ),
};

/**
 * `project-wide` — 2×1 tile. Thumb + title + 1-line description.
 * The balanced default — pairs well with most portfolio content.
 */
const wideVariant: WidgetVariant<ProjectCardData> = {
  id: 'project-wide',
  resourceType: 'project',
  size: 'wide',
  budget: 'medium',
  bestFor:
    'The default project shape — thumb on the left, title + 1-line description on the right. Use when the description adds real context (most cases).',
  requires: ['title', 'url', 'description'],
  render: (data, ctx) => (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      data-track-type="project"
      data-track-id={data.id || data.url}
      data-track-label={data.title}
      className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.04]"
      style={
        ctx.accentColor ? { borderColor: `${ctx.accentColor}28` } : undefined
      }
    >
      <SafeImage
        src={data.imageUrl}
        alt=""
        className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform duration-300 ease-[var(--karte-ease)] group-hover:scale-[1.06]"
        fallback={
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{
              backgroundColor: ctx.accentColor
                ? `${ctx.accentColor}1a`
                : 'rgba(103,232,249,0.10)',
              color: ctx.accentColor || '#67e8f9',
            }}
          >
            ◆
          </span>
        }
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-karte-text">
          {data.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.45] text-karte-text-3">
          {data.description}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="shrink-0 text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5"
      >
        ↗
      </span>
    </a>
  ),
};

/**
 * `project-hero` — text-led showcase card. Title + description carry the
 * visual weight; no full-bleed image since favicon-sized source images
 * stretched poorly to 16:9. A discreet favicon chip sits in the corner
 * when an image is available, otherwise an accent-tinted glyph.
 *
 * Use sparingly — at most one per page, for the project the user wants
 * visitors to land on.
 */
const heroVariant: WidgetVariant<ProjectCardData> = {
  id: 'project-hero',
  resourceType: 'project',
  size: 'hero',
  budget: 'high',
  bestFor:
    'A single marquee project — the one you want every visitor to see first. Use at most one per page. Title + description carry it; the image is a small chip, not a backdrop.',
  requires: ['title', 'url', 'description'],
  render: (data, ctx) => {
    const accent = ctx.accentColor || '#67e8f9';
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        data-track-type="project"
        data-track-id={data.id || data.url}
        data-track-label={data.title}
        className="group relative flex w-full flex-col gap-5 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.04] sm:p-7"
        style={{ borderColor: `${accent}28` }}
      >
        {/* Soft accent wash in the top-right corner — no full image,
            so no favicon stretching. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
          style={{ backgroundColor: `${accent}1f` }}
        />

        <div className="relative flex items-center justify-between gap-4">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span style={{ color: accent }}>◆</span> Featured project
          </p>
          <SafeImage
            src={data.imageUrl}
            alt=""
            className="h-7 w-7 rounded-md object-contain opacity-80"
            fallback={
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm"
                style={{
                  backgroundColor: `${accent}1a`,
                  color: accent,
                }}
              >
                ◆
              </span>
            }
          />
        </div>

        <div className="relative">
          <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.015em] text-karte-text sm:text-[32px]">
            {data.title}
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.55] text-karte-text-3">
            {data.description}
          </p>
        </div>

        <div className="relative mt-1 flex items-center gap-2 text-[12.5px] font-medium text-karte-text-4 transition-colors duration-200 group-hover:text-karte-text-2">
          <span className="font-mono uppercase tracking-[0.12em]">
            {hostnameFromUrl(data.url)}
          </span>
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            style={{ color: accent }}
          >
            ↗
          </span>
        </div>
      </a>
    );
  },
};

export const projectCardVariants: ReadonlyArray<
  WidgetVariant<ProjectCardData>
> = [lineVariant, squareVariant, wideVariant, heroVariant];

export const projectCardVariantsById = Object.freeze(
  Object.fromEntries(projectCardVariants.map((v) => [v.id, v])),
) as Readonly<Record<string, WidgetVariant<ProjectCardData>>>;
