import { NextResponse } from 'next/server';

import { db } from '@/db';
import { creatorOpportunities } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import {
  createOpportunitySchema,
  isOpportunityTableUnavailable,
} from '@/lib/creator-opportunities';
import {
  listCreatorOpportunities,
  listEligibleOpportunitySources,
  resolveOpportunitySource,
} from '@/lib/creator-opportunity-data';

function unavailable() {
  return NextResponse.json(
    {
      error:
        'Opportunity Desk is unavailable until its additive database migration is applied.',
      retryable: true,
    },
    { status: 503 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { pageId } = await params;
  if (!(await loadOwnedPage(pageId, auth.userId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const [opportunities, sources] = await Promise.all([
      listCreatorOpportunities(pageId),
      listEligibleOpportunitySources(pageId),
    ]);
    return NextResponse.json({ opportunities, sources });
  } catch (error) {
    if (isOpportunityTableUnavailable(error)) return unavailable();
    console.error('Failed to load creator opportunities', error);
    return NextResponse.json(
      { error: 'Could not load Opportunity Desk.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { pageId } = await params;
  if (!(await loadOwnedPage(pageId, auth.userId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = createOpportunitySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid opportunity.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const snapshot = await resolveOpportunitySource({ pageId, ...parsed.data });
    const [opportunity] = await db
      .insert(creatorOpportunities)
      .values({
        pageId,
        sourceType: parsed.data.sourceType,
        sourceId: parsed.data.sourceId || null,
        sourceSnapshot: snapshot,
        moment: parsed.data.moment,
        target: parsed.data.target || null,
        creatorNotes: parsed.data.creatorNotes || null,
        recipient: snapshot.recipient || null,
        recipientVerified: false,
        status: 'signal',
      })
      .returning();
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    if (isOpportunityTableUnavailable(error)) return unavailable();
    const message =
      error instanceof Error ? error.message : 'Could not create opportunity.';
    const invalidSource = /source|required|Lead opportunities/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: invalidSource ? 400 : 500 },
    );
  }
}
