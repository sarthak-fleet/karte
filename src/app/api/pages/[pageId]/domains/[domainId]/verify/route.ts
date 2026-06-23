import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pageDomains } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { getDnsInstructions, getDomainStatus } from '@/lib/cloudflare-domains';
import { invalidateHostCache } from '@/lib/page-domains';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; domainId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId, domainId } = await params;
  await ensureProjectsTable();

  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const domain = await db.query.pageDomains.findFirst({
    where: and(eq(pageDomains.id, domainId), eq(pageDomains.pageId, pageId)),
  });
  if (!domain)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const status = await getDomainStatus(domain.hostname).catch(
    (err: unknown) => ({
      status: 'error' as const,
      verification: [],
      configured: true,
      errorMessage: err instanceof Error ? err.message : 'Verification failed',
    }),
  );

  const now = new Date();
  const [updated] = await db
    .update(pageDomains)
    .set({
      status: status.status,
      verification: status.verification,
      errorMessage: status.errorMessage ?? null,
      lastCheckedAt: now,
      updatedAt: now,
    })
    .where(eq(pageDomains.id, domainId))
    .returning();

  invalidateHostCache(domain.hostname);

  return NextResponse.json({
    ...updated,
    dnsInstructions: getDnsInstructions(domain.hostname),
  });
}
