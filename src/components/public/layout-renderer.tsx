import { AnimatedReveal } from '@/components/public/animated-reveal';
import {
  allVariantsById,
  type LinkCardData,
  type ProjectCardData,
} from '@/components/public/widgets';
import { pickLinkVariants, pickProjectVariants } from '@/lib/widget-picker';

interface LayoutRendererProps {
  links: ReadonlyArray<LinkCardData>;
  projects: ReadonlyArray<ProjectCardData>;
  accentColor: string;
  slug: string;
}

interface AnyPick {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  variantId: string;
}

/**
 * Picks a variant for every link + project and arranges them as a
 * clean three-tier stream:
 *
 *   1. Hero (if a project-hero qualifies) — full-bleed visual anchor.
 *   2. Squares grid — image-bearing projects in a 2-col bento.
 *   3. Wides stack — projects with a description but no hero treatment.
 *   4. Lines — every link in a compact row, plus any line-shaped projects.
 *
 * Grouping by size class keeps the rhythm consistent: bento up top
 * (projects, image-led), index at the bottom (links, scannable). No
 * jagged half-rows from mixing 3-col + 4-col spans.
 */
export function LayoutRenderer({
  links,
  projects,
  accentColor,
  slug,
}: LayoutRendererProps) {
  if (links.length === 0 && projects.length === 0) return null;

  const linkPicks = pickLinkVariants(links);
  const projectPicks = pickProjectVariants(projects);

  // Pluck the hero (at most one).
  const heroIdx = projectPicks.findIndex((p) => p.variantId === 'project-hero');
  const heroPick = heroIdx >= 0 ? projectPicks[heroIdx] : null;
  const restProjects =
    heroIdx >= 0 ? projectPicks.filter((_, i) => i !== heroIdx) : projectPicks;

  const squarePicks = restProjects.filter((p) => p.variantId === 'project-square');
  const widePicks = restProjects.filter((p) => p.variantId === 'project-wide');
  const linePicks: AnyPick[] = [
    ...restProjects.filter((p) => p.variantId === 'project-line'),
    ...linkPicks,
  ];

  const ctx = { accentColor, slug };

  // Stagger reveals: each card's delay is its position in the stream so
  // they fade up in sequence, not all at once. Capped so big lists don't
  // delay the bottom items past usability.
  let staggerIdx = 0;
  const reveal = (node: React.ReactNode, key: string) => (
    <AnimatedReveal key={key} delay={Math.min(staggerIdx++ * 60, 360)}>
      {node}
    </AnimatedReveal>
  );

  return (
    <div className="space-y-6">
      {heroPick &&
        reveal(allVariantsById[heroPick.variantId]?.render(heroPick.data, ctx), 'hero')}

      {squarePicks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {squarePicks.map((pick) => {
            const v = allVariantsById[pick.variantId];
            return v ? reveal(v.render(pick.data, ctx), `sq:${pick.data.id}`) : null;
          })}
        </div>
      )}

      {widePicks.length > 0 && (
        <div className="space-y-3">
          {widePicks.map((pick) => {
            const v = allVariantsById[pick.variantId];
            return v ? reveal(v.render(pick.data, ctx), `wd:${pick.data.id}`) : null;
          })}
        </div>
      )}

      {linePicks.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {linePicks.map((pick) => {
            const v = allVariantsById[pick.variantId];
            return v ? reveal(v.render(pick.data, ctx), `ln:${pick.data.id}`) : null;
          })}
        </div>
      )}
    </div>
  );
}
