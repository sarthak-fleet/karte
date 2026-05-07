import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pageDomains, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { invalidateHostCache } from '@/lib/page-domains';
import { removeDomain } from '@/lib/vercel-domains';

async function loadOwned(pageId: string, domainId: string, userId: string) {
  await ensureProjectsTable();
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.userId, userId)),
  });
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
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pageId, domainId } = await params;
  const owned = await loadOwned(pageId, domainId, session.user.id);
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await removeDomain(owned.domain.hostname);
  await db.delete(pageDomains).where(eq(pageDomains.id, domainId));
  invalidateHostCache(owned.domain.hostname);

  return NextResponse.json({ ok: true });
}
