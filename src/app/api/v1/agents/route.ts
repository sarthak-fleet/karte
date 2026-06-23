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
import { resolveThemeConfig } from '@/lib/themes';
import { isValidSlug, isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

function getOrigin(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

async function requireAgentAuth(req: Request) {
  const auth = await authenticateApiKey(req.headers.get('authorization'));
  if (!auth) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const;
  }
  return { auth } as const;
}

export async function GET(req: Request) {
  const gate = await requireAgentAuth(req);
  if ('error' in gate) return gate.error;

  await ensureProjectsTable();

  const rows = await db
    .select()
    .from(pages)
    .where(
      and(eq(pages.userId, gate.auth.userId), eq(pages.pageType, 'agent')),
    );

  return NextResponse.json({
    agents: rows.map(sanitizeAgentPageResponse),
  });
}

export async function POST(req: Request) {
  const gate = await requireAgentAuth(req);
  if ('error' in gate) return gate.error;

  await ensureProjectsTable();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug =
    typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const displayName =
    typeof body.displayName === 'string' ? body.displayName.trim() : '';

  if (!slug || !displayName) {
    return NextResponse.json(
      { error: 'slug and displayName are required' },
      { status: 400 },
    );
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      {
        error:
          'Slug must be 3-50 chars, lowercase alphanumeric and hyphens only',
      },
      { status: 400 },
    );
  }

  if (displayName.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: 'displayName is too long' },
      { status: 400 },
    );
  }

  const existing = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Slug is already taken' },
      { status: 409 },
    );
  }

  const agentPurpose =
    typeof body.agentPurpose === 'string'
      ? body.agentPurpose.trim()
      : typeof body.bio === 'string'
        ? body.bio.trim()
        : null;

  if (agentPurpose && agentPurpose.length > MAX_AGENT_PURPOSE_LENGTH) {
    return NextResponse.json(
      { error: 'agentPurpose is too long' },
      { status: 400 },
    );
  }

  const agentOperator =
    typeof body.agentOperator === 'string' ? body.agentOperator.trim() : null;
  if (agentOperator && agentOperator.length > MAX_AGENT_OPERATOR_LENGTH) {
    return NextResponse.json(
      { error: 'agentOperator is too long' },
      { status: 400 },
    );
  }

  const agentOperatorUrl =
    typeof body.agentOperatorUrl === 'string'
      ? body.agentOperatorUrl.trim()
      : null;
  if (agentOperatorUrl && !isValidUrl(agentOperatorUrl)) {
    return NextResponse.json(
      { error: 'agentOperatorUrl must be a valid URL' },
      { status: 400 },
    );
  }

  const agentDisclosurePolicy =
    typeof body.agentDisclosurePolicy === 'string'
      ? body.agentDisclosurePolicy.trim()
      : null;
  if (
    agentDisclosurePolicy &&
    agentDisclosurePolicy.length > MAX_AGENT_DISCLOSURE_LENGTH
  ) {
    return NextResponse.json(
      { error: 'agentDisclosurePolicy is too long' },
      { status: 400 },
    );
  }

  const capabilities = normalizeAgentCapabilities(body.agentCapabilities);
  if (body.agentCapabilities !== undefined && capabilities === null) {
    return NextResponse.json(
      { error: 'agentCapabilities must be a valid array' },
      { status: 400 },
    );
  }

  const avatarUrl =
    typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : null;
  if (avatarUrl && !isValidUrl(avatarUrl)) {
    return NextResponse.json(
      { error: 'avatarUrl must be a valid URL' },
      { status: 400 },
    );
  }

  const brainEndpointUrl =
    typeof body.brainEndpointUrl === 'string'
      ? body.brainEndpointUrl.trim()
      : null;
  if (brainEndpointUrl && !isValidUrl(brainEndpointUrl)) {
    return NextResponse.json(
      { error: 'brainEndpointUrl must be a valid URL' },
      { status: 400 },
    );
  }

  const brainEndpointAuth =
    typeof body.brainEndpointAuth === 'string'
      ? body.brainEndpointAuth.trim()
      : null;

  const now = new Date();
  const origin = getOrigin(req);

  const [page] = await db
    .insert(pages)
    .values({
      userId: gate.auth.userId,
      slug,
      displayName,
      pageType: 'agent',
      bio: agentPurpose,
      avatarUrl,
      themeConfig: resolveThemeConfig(),
      published: false,
      chatEnabled:
        body.chatEnabled === undefined ? true : Boolean(body.chatEnabled),
      agentPurpose,
      agentOperator,
      agentOperatorUrl,
      agentCapabilities: capabilities ?? [],
      agentDisclosurePolicy,
      brainEndpointUrl,
      brainEndpointAuth,
      brainEndpointShape: 'openai-chat',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(
    {
      agent: sanitizeAgentPageResponse(page),
      urls: {
        profile: `${origin}/${page.slug}`,
        manifest: `${origin}/${page.slug}/agent.json`,
      },
    },
    { status: 201 },
  );
}
