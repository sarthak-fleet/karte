import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { creatorOpportunities } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import {
  applyOpportunityLifecyclePatch,
  isOpportunityTableUnavailable,
  updateOpportunitySchema,
} from '@/lib/creator-opportunities';
import { getCreatorOpportunity } from '@/lib/creator-opportunity-data';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string; opportunityId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { pageId, opportunityId } = await params;
  if (!(await loadOwnedPage(pageId, auth.userId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const opportunity = await getCreatorOpportunity(pageId, opportunityId);
    if (!opportunity)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const parsed = updateOpportunitySchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }

    const lifecycle = applyOpportunityLifecyclePatch(
      {
        status: opportunity.status,
        analysis: opportunity.analysis ?? null,
        recipient: opportunity.recipient,
        recipientVerified: opportunity.recipientVerified,
        draftSubject: opportunity.draftSubject,
        draftBody: opportunity.draftBody,
        approvedAt: opportunity.approvedAt,
      },
      parsed.data,
    );
    const analysis =
      parsed.data.partnershipAngles && opportunity.analysis
        ? {
            ...opportunity.analysis,
            partnershipAngles: parsed.data.partnershipAngles,
          }
        : opportunity.analysis;
    const {
      action: _action,
      partnershipAngles: _angles,
      ...fields
    } = lifecycle;
    const [updated] = await db
      .update(creatorOpportunities)
      .set({ ...fields, analysis, updatedAt: new Date() })
      .where(eq(creatorOpportunities.id, opportunityId))
      .returning();
    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    if (isOpportunityTableUnavailable(error)) {
      return NextResponse.json(
        {
          error: 'Opportunity Desk database migration is not applied.',
          retryable: true,
        },
        { status: 503 },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Could not update opportunity.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
