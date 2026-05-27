import { NextResponse } from 'next/server';

import { ImportError, isBlockedUrl, parseSource } from '@/lib/link-import';
import { rateLimit } from '@/lib/rate-limit';
import { isValidUrl } from '@/lib/validation';

/**
 * Public preview endpoint used by the unauthenticated /create flow. Returns
 * the same shape as the authenticated preview but does NOT write to the DB.
 * Rate-limited per IP.
 */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(`import-preview:${ip}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const record = (body ?? {}) as Record<string, unknown>;
  const sourceUrl = typeof record.sourceUrl === 'string' ? record.sourceUrl.trim() : '';

  if (!isValidUrl(sourceUrl) || isBlockedUrl(sourceUrl)) {
    return NextResponse.json({ error: 'Enter a valid public URL' }, { status: 400 });
  }

  try {
    const { links } = await parseSource(sourceUrl);
    // Strip thumbnail before returning — the preview endpoint exposes only the
    // shape that the dashboard import flow needs.
    const trimmed = links.map(({ title, url }) => ({ title, url }));
    return NextResponse.json({ links: trimmed });
  } catch (error) {
    if (error instanceof ImportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import links' },
      { status: 502 },
    );
  }
}
