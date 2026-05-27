// Variant registry. As more content types add variants (projects,
// sections, info-blocks), register them here so the AI Revamp prompt
// builder + the LayoutRenderer can iterate over the full catalog.
//
// See docs/plans/generative-ui.md for the larger plan.

import type { WidgetVariant } from '@/lib/widget-types';

import {
  type LinkCardData,
  linkCardVariants,
  linkCardVariantsById,
} from './link-card-variants';
import {
  type ProjectCardData,
  projectCardVariants,
  projectCardVariantsById,
} from './project-card-variants';

export type { LinkCardData, ProjectCardData };
export { linkCardVariants, linkCardVariantsById };
export { projectCardVariants, projectCardVariantsById };

/**
 * Full catalog of every variant the renderer knows about, flattened
 * across content types. Useful for AI prompt construction (it sees
 * every available shape and its `bestFor` hint) and for validation
 * when a stored layout plan references a variant id.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allVariants: ReadonlyArray<WidgetVariant<any>> = [
  ...linkCardVariants,
  ...projectCardVariants,
  // future: ...sectionCardVariants, ...infoBlockVariants
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allVariantsById: Readonly<Record<string, WidgetVariant<any>>> =
  Object.freeze(Object.fromEntries(allVariants.map((v) => [v.id, v])));

/**
 * Returns true if `variantId` is registered AND `data` satisfies the
 * variant's required fields. Useful before rendering a stored plan to
 * catch stale references gracefully (e.g. a plan references
 * 'link-hero' but the link's image was removed).
 */
export function variantCanRender<TData extends Record<string, unknown>>(
  variantId: string,
  data: TData,
): boolean {
  const variant = allVariantsById[variantId];
  if (!variant) return false;
  return variant.requires.every((key) => {
    const value = data[key as string];
    return value !== undefined && value !== null && value !== '';
  });
}
