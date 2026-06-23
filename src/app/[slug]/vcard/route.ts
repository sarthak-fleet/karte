import { getFullPageData } from '../_lib/get-page-data';

export const dynamic = 'force-dynamic';

function escapeVCardValue(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Downloadable VCard for the profile. Lets visitors save the user as a
 * contact in one tap — handy for in-person sharing / conference name tags.
 * Returns RFC 6350 (vCard 4.0) text with the page's links as URL entries.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const data = await getFullPageData(slug);
  if (!data) return new Response('not found', { status: 404 });

  const { page, links } = data;

  const lines: string[] = [];
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:4.0');
  lines.push(`FN:${escapeVCardValue(page.displayName ?? slug)}`);
  if (page.bio) lines.push(`NOTE:${escapeVCardValue(page.bio)}`);
  if (page.avatarUrl) lines.push(`PHOTO:${page.avatarUrl}`);

  // Primary URL — the profile page itself.
  lines.push(`URL;TYPE=profile:https://karte.cc/${encodeURIComponent(slug)}`);

  for (const link of links) {
    if (!link.url) continue;
    const type = (link.title ?? 'link')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    lines.push(`URL;TYPE=${escapeVCardValue(type || 'link')}:${link.url}`);
  }

  lines.push(`UID:karte-${slug}`);
  lines.push(`REV:${new Date().toISOString()}`);
  lines.push('END:VCARD');

  return new Response(`${lines.join('\r\n')}\r\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.vcf"`,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
