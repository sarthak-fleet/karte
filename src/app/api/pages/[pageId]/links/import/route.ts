import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { links } from '@/db/schema';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import {
  ImportError,
  type ImportedLink,
  isBlockedUrl,
  MAX_IMPORT_LINKS,
  parseSource,
} from '@/lib/link-import';
import { isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

async function verifyOwnership(pageId: string, userId: string) {
  return loadOwnedPage(pageId, userId);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;
  const page = await verifyOwnership(pageId, auth.userId);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const mode = body.mode === 'import' ? 'import' : 'preview';

  if (mode === 'preview') {
    const sourceUrl =
      typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
    if (!isValidUrl(sourceUrl) || isBlockedUrl(sourceUrl)) {
      return NextResponse.json(
        { error: 'Enter a valid public URL' },
        { status: 400 },
      );
    }

    try {
      const { links: importedLinks } = await parseSource(sourceUrl);
      return NextResponse.json({ links: importedLinks });
    } catch (error) {
      if (error instanceof ImportError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to import links',
        },
        { status: 502 },
      );
    }
  }

  const incomingLinks: unknown[] = Array.isArray(body.links) ? body.links : [];
  const importedLinks = incomingLinks
    .map((item): ImportedLink | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const title =
        typeof record.title === 'string'
          ? record.title.trim().slice(0, MAX_TITLE_LENGTH)
          : '';
      const url = typeof record.url === 'string' ? record.url.trim() : '';
      if (!title || !isValidUrl(url) || isBlockedUrl(url)) return null;
      return { title, url };
    })
    .filter((item): item is ImportedLink => Boolean(item))
    .slice(0, MAX_IMPORT_LINKS);

  if (importedLinks.length === 0) {
    return NextResponse.json(
      { error: 'No valid links selected' },
      { status: 400 },
    );
  }

  const existingLinks = await db
    .select({ url: links.url })
    .from(links)
    .where(eq(links.pageId, pageId));
  const existingUrls = new Set(existingLinks.map((item) => item.url));

  const [maxLink] = await db
    .select({ sortOrder: links.sortOrder })
    .from(links)
    .where(eq(links.pageId, pageId))
    .orderBy(desc(links.sortOrder))
    .limit(1);

  const startOrder = (maxLink?.sortOrder ?? -1) + 1;
  const values = importedLinks
    .filter((item) => !existingUrls.has(item.url))
    .map((item, index) => ({
      pageId,
      title: item.title,
      url: item.url,
      sortOrder: startOrder + index,
      enabled: true,
    }));

  if (values.length === 0) {
    return NextResponse.json({ imported: [], skipped: importedLinks.length });
  }

  const inserted = await db.insert(links).values(values).returning();

  return NextResponse.json({
    imported: inserted,
    skipped: importedLinks.length - inserted.length,
  });
}
