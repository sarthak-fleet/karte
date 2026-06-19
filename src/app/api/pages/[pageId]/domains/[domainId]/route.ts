import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pageDomains } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { removeDomain } from '@/lib/cloudflare-domains';
import { invalidateHostCache } from '@/lib/page-domains';

async function loadOwned(pageId: string, domainId: string, userId: string) {
  await ensureProjectsTable();
  const page = await loadOwnedPage(pageId, userId);
  if (!page) return null;
  const domain = await db.query.pageDomains.findFirst({
    where: and(eq(pageDomains.id, domainId), eq(pageDomains.pageId, pageId)),
  });
  if (!domain) return null;
  return { page, domain };
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; domainId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId, domainId } = await params;
  const owned = await loadOwned(pageId, domainId, auth.userId);
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await removeDomain(owned.domain.hostname);
  await db.delete(pageDomains).where(eq(pageDomains.id, domainId));
  invalidateHostCache(owned.domain.hostname);

  return NextResponse.json({ ok: true });
}
