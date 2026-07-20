// Variant registry. As more content types add variants (projects,
// sections, info-blocks), register them here so the AI Revamp prompt
// builder + the LayoutRenderer can iterate over the full catalog.
//
// See docs/plans/generative-ui.md for the larger plan.

import type { ReactNode } from 'react';

import type { WidgetRenderContext, WidgetVariant } from '@/lib/widget-types';

import { type LinkCardData, linkCardVariants } from './link-card-variants';
import {
  type ProjectCardData,
  projectCardVariants,
} from './project-card-variants';

export type { LinkCardData, ProjectCardData };
export { linkCardVariants, projectCardVariants };

/**
 * Full catalog of every variant the renderer knows about, flattened
 * across content types. Useful for AI prompt construction (it sees
 * every available shape and its `bestFor` hint) and for validation
 * when a stored layout plan references a variant id.
 */
export type AnyWidgetData = LinkCardData | ProjectCardData;
export type AnyWidgetVariant = Omit<
  WidgetVariant<AnyWidgetData>,
  'render' | 'requires'
> & {
  requires: ReadonlyArray<string>;
  render: (data: AnyWidgetData, ctx: WidgetRenderContext) => ReactNode;
};

const allVariants: ReadonlyArray<AnyWidgetVariant> = [
  ...(linkCardVariants as unknown as ReadonlyArray<AnyWidgetVariant>),
  ...(projectCardVariants as unknown as ReadonlyArray<AnyWidgetVariant>),
  // future: ...sectionCardVariants, ...infoBlockVariants
];

export const allVariantsById: Readonly<Record<string, AnyWidgetVariant>> =
  Object.freeze(Object.fromEntries(allVariants.map((v) => [v.id, v])));
