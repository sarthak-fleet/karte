// Default heuristic picker that maps user content → widget variant.
// This is the "what variant would the AI choose if asked right now?" oracle
// — used both by the widget directory demo and as the fallback when no
// stored layoutPlan exists. The AI Revamp endpoint will eventually return
// the same shape, just with smarter judgement.

import type { LinkCardData, ProjectCardData } from '@/components/public/widgets';

export interface PickResult<TData> {
  data: TData;
  variantId: string;
  reason: string;
}

/**
 * Pick a variant for each link. We deliberately ship a single shape
 * (`link-line`) — see link-card-variants.tsx for the rationale. The
 * function stays in this shape so the picker contract is consistent
 * across resource types and we can re-introduce sized link variants
 * later without touching callers.
 */
export function pickLinkVariants(
  links: ReadonlyArray<LinkCardData>,
): PickResult<LinkCardData>[] {
  return links.map((link) => ({
    data: link,
    variantId: 'link-line',
    reason: link.body
      ? 'compact row with body for one-line context'
      : 'compact row — icon auto-detected from host',
  }));
}

/**
 * Pick a variant id for each project. Rules:
 *   1. First project with image + description → `project-hero` (single
 *      marquee piece).
 *   2. Subsequent projects with image → alternate `project-square` and
 *      `project-wide` for visual rhythm.
 *   3. Projects without image → `project-line`.
 */
export function pickProjectVariants(
  projects: ReadonlyArray<ProjectCardData>,
): PickResult<ProjectCardData>[] {
  let heroPicked = false;
  let imageIndex = 0;

  return projects.map((project) => {
    const hasImage = !!project.imageUrl;
    const hasDescription = !!project.description && project.description.length > 20;

    if (hasImage && hasDescription && !heroPicked) {
      heroPicked = true;
      return {
        data: project,
        variantId: 'project-hero',
        reason: 'first image + description — best featured shape',
      };
    }
    if (hasImage) {
      const variantId =
        imageIndex++ % 2 === 0 ? 'project-square' : 'project-wide';
      return {
        data: project,
        variantId,
        reason:
          variantId === 'project-square'
            ? 'has image — alternating square for visual rhythm'
            : 'has image — alternating wide so descriptions read clearly',
      };
    }
    return {
      data: project,
      variantId: 'project-line',
      reason: 'no image — line keeps it compact',
    };
  });
}
