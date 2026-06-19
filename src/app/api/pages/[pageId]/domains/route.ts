import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pageDomains } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { addDomain, getDnsInstructions } from '@/lib/cloudflare-domains';
import {
  findConflictingDomain,
  getAppHost,
  isAppHost,
  normalizeHostname,
} from '@/lib/page-domains';

async function requirePageOwner(pageId: string, userId: string) {
  await ensureProjectsTable();
  return loadOwnedPage(pageId, userId);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;
  const page = await requirePageOwner(pageId, auth.userId);
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const domains = await db
    .select()
    .from(pageDomains)
    .where(eq(pageDomains.pageId, pageId));

  return NextResponse.json(
    domains.map((d) => ({
      ...d,
      dnsInstructions: getDnsInstructions(d.hostname),
    })),
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;
  const page = await requirePageOwner(pageId, auth.userId);
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const hostname = normalizeHostname(body?.hostname);
  if (!hostname) {
    return NextResponse.json(
      { error: 'Invalid hostname' },
      { status: 400 },
    );
  }

  if (isAppHost(hostname, getAppHost())) {
    return NextResponse.json(
      { error: 'Cannot use the app domain as a custom domain' },
      { status: 400 },
    );
  }

  const conflict = await findConflictingDomain(hostname);
  if (conflict) {
    return NextResponse.json(
      { error: 'Hostname already attached to a page' },
      { status: 409 },
    );
  }

  const provider = await addDomain(hostname).catch((err: unknown) => ({
    status: 'error' as const,
    verification: [],
    configured: true,
    errorMessage: err instanceof Error ? err.message : 'Domain provider request failed',
  }));

  const now = new Date();
  const [created] = await db
    .insert(pageDomains)
    .values({
      pageId,
      hostname,
      status: provider.status,
      verification: provider.verification,
      errorMessage: provider.errorMessage,
      lastCheckedAt: now,
      isPrimary: false,
    })
    .returning();

  return NextResponse.json(
    {
      ...created,
      dnsInstructions: getDnsInstructions(hostname),
    },
    { status: 201 },
  );
}
