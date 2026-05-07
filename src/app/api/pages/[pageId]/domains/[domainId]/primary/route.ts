import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pageDomains, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { setPrimaryDomain } from '@/lib/page-domains';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; domainId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pageId, domainId } = await params;
  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.userId, session.user.id)),
  });
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const domain = await db.query.pageDomains.findFirst({
    where: and(eq(pageDomains.id, domainId), eq(pageDomains.pageId, pageId)),
  });
  if (!domain) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (domain.status !== 'verified') {
    return NextResponse.json(
      { error: 'Domain must be verified before being marked primary' },
      { status: 400 },
    );
  }

  await setPrimaryDomain(pageId, domainId);
  return NextResponse.json({ ok: true });
}
