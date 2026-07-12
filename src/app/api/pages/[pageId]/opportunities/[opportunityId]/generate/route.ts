import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { creatorOpportunities, infoBlocks, projects, users } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import {
  isOpportunityTableUnavailable,
  parseGeneratedOpportunityBrief,
} from '@/lib/creator-opportunities';
import { getCreatorOpportunity } from '@/lib/creator-opportunity-data';
import { rateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are Karte's Opportunity Desk. Produce one conservative, reviewable creator partnership brief as strict JSON only.
Never invent contact details or claim a named brand is interested, reachable, or currently running a campaign. Named brands are hypotheses for the creator to verify.
Return exactly: {"schemaVersion":1,"title":string,"leadTime":string,"fitRationale":string,"riskNotes":string[],"partnershipAngles":string[1..4],"brandCategories":string[],"namedBrandHypotheses":string[],"draft":{"subject":string,"body":string}}.`;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ pageId: string; opportunityId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { pageId, opportunityId } = await params;
  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rate = await rateLimit(`opportunity-generate:${auth.userId}`, {
    windowMs: 3_600_000,
    maxRequests: 10,
  });
  if (!rate.ok)
    return NextResponse.json(
      { error: 'Generation limit reached. Try later.' },
      { status: 429 },
    );

  try {
    const opportunity = await getCreatorOpportunity(pageId, opportunityId);
    if (!opportunity)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [owners, memory, portfolio] = await Promise.all([
      db.select().from(users).where(eq(users.id, auth.userId)).limit(1),
      db
        .select({ title: infoBlocks.title, content: infoBlocks.content })
        .from(infoBlocks)
        .where(eq(infoBlocks.pageId, pageId))
        .limit(8),
      db
        .select({ title: projects.title, description: projects.description })
        .from(projects)
        .where(eq(projects.pageId, pageId))
        .limit(8),
    ]);
    const aiConfig = resolveAiConfig(owners[0]);
    if (!aiConfig) {
      return NextResponse.json(
        {
          error:
            'AI is not configured. Add an AI provider in Memory settings and retry.',
          retryable: true,
        },
        { status: 503 },
      );
    }

    const boundedContext = JSON.stringify({
      creator: {
        displayName: page.displayName,
        bio: page.bio?.slice(0, 1000) ?? null,
      },
      source: opportunity.sourceSnapshot,
      moment: opportunity.moment.slice(0, 1200),
      target: opportunity.target?.slice(0, 240) ?? null,
      notes: opportunity.creatorNotes?.slice(0, 2000) ?? null,
      profileMemory: memory.map((item) => ({
        title: item.title?.slice(0, 120) ?? null,
        content: item.content.slice(0, 800),
      })),
      projects: portfolio.map((item) => ({
        title: item.title.slice(0, 120),
        description: item.description.slice(0, 500),
      })),
    });

    const raw = await generate(aiConfig, {
      system: SYSTEM_PROMPT,
      prompt: `Create a partnership opportunity brief from this owner-selected context:\n${boundedContext}`,
      reasoningLevel: 'deep',
      maxOutputTokens: 1800,
      timeoutMs: 45_000,
    });
    const brief = parseGeneratedOpportunityBrief(raw);

    const [updated] = await db
      .update(creatorOpportunities)
      .set({
        analysis: {
          schemaVersion: 1,
          title: brief.title,
          leadTime: brief.leadTime,
          fitRationale: brief.fitRationale,
          riskNotes: brief.riskNotes,
          partnershipAngles: brief.partnershipAngles,
          brandCategories: brief.brandCategories,
          namedBrandHypotheses: brief.namedBrandHypotheses,
        },
        draftSubject: brief.draft.subject,
        draftBody: brief.draft.body,
        status: 'drafted',
        approvedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(creatorOpportunities.id, opportunityId),
          eq(creatorOpportunities.pageId, pageId),
        ),
      )
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
    console.error('Opportunity generation failed', error);
    return NextResponse.json(
      {
        error:
          'Generation failed or returned invalid JSON. Your existing signal and draft were preserved.',
        retryable: true,
      },
      { status: 502 },
    );
  }
}
