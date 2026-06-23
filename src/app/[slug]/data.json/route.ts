import { NextResponse } from 'next/server';

import { getFullPageData } from '../_lib/get-page-data';

export const dynamic = 'force-dynamic';

/**
 * Public JSON dump of a profile — same data the public page renders,
 * minus the React-specific shapes. Lets people back up their own
 * profile, mirror it on another platform, or build their own UI.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const data = await getFullPageData(slug);
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { page, links, projects, sections, readyPages } = data;

  return NextResponse.json(
    {
      slug: page.slug,
      displayName: page.displayName,
      bio: page.bio ?? null,
      avatarUrl: page.avatarUrl ?? null,
      themeConfig: page.themeConfig ?? null,
      modes: {
        chat: page.chatEnabled ?? false,
        encyclopedia:
          (page.encyclopediaEnabled ?? false) && readyPages.has('encyclopedia'),
        roast: (page.roastEnabled ?? false) && readyPages.has('roast'),
        newspaper:
          (page.newspaperEnabled ?? false) && readyPages.has('newspaper'),
      },
      links: links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon ?? null,
        sortOrder: l.sortOrder ?? 0,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.url,
        imageUrl: p.imageUrl ?? null,
        sortOrder: p.sortOrder ?? 0,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content ?? null,
        buttonLabel: s.buttonLabel ?? null,
        buttonUrl: s.buttonUrl ?? null,
        sortOrder: s.sortOrder ?? 0,
      })),
      generatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
