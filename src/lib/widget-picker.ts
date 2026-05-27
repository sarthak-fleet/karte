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
 * Pick a variant id for each link. Rules, in order:
 *   1. The single link with the strongest visual (image + body) → `link-hero`,
 *      but only once per page.
 *   2. Links with an image → `link-square`.
 *   3. Links with a body but no image → `link-wide`.
 *   4. Everything else → `link-line`.
 */
export function pickLinkVariants(
  links: ReadonlyArray<LinkCardData>,
): PickResult<LinkCardData>[] {
  // Pick the hero candidate first: the link with both image + body, longest
  // body (more weight = more reason to feature it). Falls back to first with
  // an image. At most one per page so heroes don't pile up.
  const heroCandidates = links
    .filter((l) => l.imageUrl && l.body)
    .sort((a, b) => (b.body?.length ?? 0) - (a.body?.length ?? 0));
  const heroId = heroCandidates[0]?.id;

  return links.map((link) => {
    if (link.id === heroId) {
      return {
        data: link,
        variantId: 'link-hero',
        reason: 'has image + body, strongest weight on this page',
      };
    }
    if (link.imageUrl) {
      return {
        data: link,
        variantId: 'link-square',
        reason: 'has image — square shows it without dominating the row',
      };
    }
    if (link.body) {
      return {
        data: link,
        variantId: 'link-wide',
        reason: 'has body copy — wide gives the description room',
      };
    }
    return {
      data: link,
      variantId: 'link-line',
      reason: 'plain link — line keeps the stack scannable',
    };
  });
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
