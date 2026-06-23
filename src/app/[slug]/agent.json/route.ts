import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { pages } from '@/db/schema';
import { buildAgentManifest } from '@/lib/agent-pages';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  await ensureProjectsTable();

  const [page] = await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.slug, slug),
        eq(pages.pageType, 'agent'),
        eq(pages.published, true),
      ),
    );

  if (!page) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://karte.cc';
  const manifest = buildAgentManifest(page, origin);

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
