import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pages } from '@/db/schema';
import { authenticateApiKey } from '@/lib/agent-api-auth';
import {
  MAX_AGENT_DISCLOSURE_LENGTH,
  MAX_AGENT_OPERATOR_LENGTH,
  MAX_AGENT_PURPOSE_LENGTH,
  normalizeAgentCapabilities,
  sanitizeAgentPageResponse,
} from '@/lib/agent-pages';
import { isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

function getOrigin(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

async function loadOwnedAgent(slug: string, userId: string) {
  return db.query.pages.findFirst({
    where: and(
      eq(pages.slug, slug),
      eq(pages.userId, userId),
      eq(pages.pageType, 'agent'),
    ),
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await authenticateApiKey(req.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  await ensureProjectsTable();

  const page = await loadOwnedAgent(slug, auth.userId);
  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const origin = getOrigin(req);
  return NextResponse.json({
    agent: sanitizeAgentPageResponse(page),
    urls: {
      profile: `${origin}/${page.slug}`,
      manifest: `${origin}/${page.slug}/agent.json`,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await authenticateApiKey(req.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  await ensureProjectsTable();

  const page = await loadOwnedAgent(slug, auth.userId);
  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Partial<typeof pages.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || !body.displayName.trim()) {
      return NextResponse.json(
        { error: 'displayName must be a non-empty string' },
        { status: 400 },
      );
    }
    if (body.displayName.trim().length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: 'displayName is too long' },
        { status: 400 },
      );
    }
    updates.displayName = body.displayName.trim();
  }

  if (body.agentPurpose !== undefined) {
    const value =
      typeof body.agentPurpose === 'string' ? body.agentPurpose.trim() : '';
    if (value.length > MAX_AGENT_PURPOSE_LENGTH) {
      return NextResponse.json(
        { error: 'agentPurpose is too long' },
        { status: 400 },
      );
    }
    updates.agentPurpose = value || null;
    updates.bio = value || null;
  }

  if (body.agentOperator !== undefined) {
    const value =
      typeof body.agentOperator === 'string' ? body.agentOperator.trim() : '';
    if (value.length > MAX_AGENT_OPERATOR_LENGTH) {
      return NextResponse.json(
        { error: 'agentOperator is too long' },
        { status: 400 },
      );
    }
    updates.agentOperator = value || null;
  }

  if (body.agentOperatorUrl !== undefined) {
    const value =
      typeof body.agentOperatorUrl === 'string'
        ? body.agentOperatorUrl.trim()
        : '';
    if (value && !isValidUrl(value)) {
      return NextResponse.json(
        { error: 'agentOperatorUrl must be a valid URL' },
        { status: 400 },
      );
    }
    updates.agentOperatorUrl = value || null;
  }

  if (body.agentDisclosurePolicy !== undefined) {
    const value =
      typeof body.agentDisclosurePolicy === 'string'
        ? body.agentDisclosurePolicy.trim()
        : '';
    if (value.length > MAX_AGENT_DISCLOSURE_LENGTH) {
      return NextResponse.json(
        { error: 'agentDisclosurePolicy is too long' },
        { status: 400 },
      );
    }
    updates.agentDisclosurePolicy = value || null;
  }

  if (body.agentCapabilities !== undefined) {
    const capabilities = normalizeAgentCapabilities(body.agentCapabilities);
    if (capabilities === null) {
      return NextResponse.json(
        { error: 'agentCapabilities must be a valid array' },
        { status: 400 },
      );
    }
    updates.agentCapabilities = capabilities;
  }

  if (body.avatarUrl !== undefined) {
    const value =
      typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : '';
    if (value && !isValidUrl(value)) {
      return NextResponse.json(
        { error: 'avatarUrl must be a valid URL' },
        { status: 400 },
      );
    }
    updates.avatarUrl = value || null;
  }

  if (body.chatEnabled !== undefined) {
    updates.chatEnabled = Boolean(body.chatEnabled);
  }

  if (body.brainEndpointUrl !== undefined) {
    const value =
      typeof body.brainEndpointUrl === 'string'
        ? body.brainEndpointUrl.trim()
        : '';
    if (value && !isValidUrl(value)) {
      return NextResponse.json(
        { error: 'brainEndpointUrl must be a valid URL' },
        { status: 400 },
      );
    }
    updates.brainEndpointUrl = value || null;
  }

  if (body.brainEndpointAuth !== undefined) {
    const value =
      typeof body.brainEndpointAuth === 'string'
        ? body.brainEndpointAuth.trim()
        : '';
    updates.brainEndpointAuth = value || null;
  }

  const [updated] = await db
    .update(pages)
    .set(updates)
    .where(eq(pages.id, page.id))
    .returning();

  const origin = getOrigin(req);
  return NextResponse.json({
    agent: sanitizeAgentPageResponse(updated),
    urls: {
      profile: `${origin}/${updated.slug}`,
      manifest: `${origin}/${updated.slug}/agent.json`,
    },
  });
}
