import { z } from 'zod';

import type {
  CreatorOpportunityAnalysis,
  CreatorOpportunityStatus,
} from '@/db/schema';

const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const opportunitySourceTypeSchema = z.enum([
  'manual',
  'timeline',
  'lead',
  'contact',
  'conversation',
  'email',
]);

export const createOpportunitySchema = z.object({
  sourceType: opportunitySourceTypeSchema.default('manual'),
  sourceId: z.string().trim().max(120).optional().nullable(),
  moment: shortText(1200),
  target: optionalText(240),
  creatorNotes: optionalText(2000),
});

export const updateOpportunitySchema = z
  .object({
    action: z.enum(['approve', 'dismiss']).optional(),
    target: optionalText(240),
    creatorNotes: optionalText(2000),
    recipient: optionalText(320),
    recipientVerified: z.boolean().optional(),
    draftSubject: optionalText(300),
    draftBody: optionalText(8000),
    partnershipAngles: z.array(shortText(500)).max(4).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No fields to update');

export const generatedOpportunityBriefSchema = z.object({
  schemaVersion: z.literal(1),
  title: shortText(200),
  leadTime: shortText(240),
  fitRationale: shortText(1600),
  riskNotes: z.array(shortText(500)).min(1).max(6),
  partnershipAngles: z.array(shortText(500)).min(1).max(4),
  brandCategories: z.array(shortText(120)).min(1).max(6),
  namedBrandHypotheses: z.array(shortText(160)).max(6).default([]),
  draft: z.object({
    subject: shortText(300),
    body: shortText(8000),
  }),
});

export type GeneratedOpportunityBrief = z.infer<
  typeof generatedOpportunityBriefSchema
>;

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1]?.trim() ?? trimmed;
}

export function parseGeneratedOpportunityBrief(
  raw: string,
): GeneratedOpportunityBrief {
  const parsed = JSON.parse(stripCodeFence(raw)) as unknown;
  return generatedOpportunityBriefSchema.parse(parsed);
}

export type OpportunityLifecycleInput = {
  status: CreatorOpportunityStatus;
  analysis: CreatorOpportunityAnalysis | null;
  recipient: string | null;
  recipientVerified: boolean;
  draftSubject: string | null;
  draftBody: string | null;
  approvedAt: Date | null;
};

export type OpportunityLifecyclePatch = z.infer<typeof updateOpportunitySchema>;

export function applyOpportunityLifecyclePatch(
  current: OpportunityLifecycleInput,
  patch: OpportunityLifecyclePatch,
  now = new Date(),
) {
  if (patch.action === 'dismiss') {
    return { ...patch, status: 'dismissed' as const, approvedAt: null };
  }

  if (patch.action === 'approve') {
    if (
      !current.analysis ||
      !current.draftSubject?.trim() ||
      !current.draftBody?.trim()
    ) {
      throw new Error(
        'A generated draft with subject and body is required before approval.',
      );
    }
    return { ...patch, status: 'approved' as const, approvedAt: now };
  }

  const materialEdit =
    patch.recipient !== undefined ||
    patch.recipientVerified !== undefined ||
    patch.draftSubject !== undefined ||
    patch.draftBody !== undefined ||
    patch.partnershipAngles !== undefined;

  return {
    ...patch,
    ...(current.status === 'approved' && materialEdit
      ? { status: 'drafted' as const, approvedAt: null }
      : {}),
  };
}

export function isValidEmail(
  value: string | null | undefined,
): value is string {
  return Boolean(value && z.string().email().safeParse(value.trim()).success);
}

export function buildOpportunityMailto(input: {
  status: CreatorOpportunityStatus;
  recipient: string | null;
  recipientVerified: boolean;
  subject: string | null;
  body: string | null;
}): string | null {
  if (
    input.status !== 'approved' ||
    !input.recipientVerified ||
    !isValidEmail(input.recipient) ||
    !input.subject?.trim() ||
    !input.body?.trim()
  ) {
    return null;
  }

  const params = new URLSearchParams({
    subject: input.subject.trim(),
    body: input.body.trim(),
  });
  return `mailto:${encodeURIComponent(input.recipient.trim())}?${params.toString()}`;
}

export function isOpportunityTableUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /creatorOpportunities|no such table|D1_ERROR/i.test(message);
}
