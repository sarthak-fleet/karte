import { db, ensureProjectsTable } from '@/db';
import { pages, users, infoBlocks, links, projects, generatedPages } from '@/db/schema';
import type { PageSettings } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { generateCompletion, parseAIResponse } from '@/lib/saasmaker';
import { NEWSPAPER_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { rateLimit } from '@/lib/rate-limit';
import { asGeneratedPageContent, type NewspaperContent } from '@/lib/generated-page-types';
import { getScrapedContext } from '@/lib/scrape-page-content';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(`newspaper:${ip}`, { windowMs: 3_600_000, maxRequests: 3 });
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await ensureProjectsTable();

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page || !page.newspaperEnabled) {
    return new Response(
      JSON.stringify({ error: 'Newspaper not enabled' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));
  if (!user?.smApiKey || !user?.smIndexId) {
    return new Response(
      JSON.stringify({ error: 'AI not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch links, projects, info blocks, and scraped content in parallel
  const [pageLinks, pageProjects, blocks, scrapedContext] = await Promise.all([
    db.select().from(links).where(eq(links.pageId, pageId)).orderBy(asc(links.sortOrder)),
    db.select().from(projects).where(eq(projects.pageId, pageId)).orderBy(asc(projects.sortOrder)),
    db.select().from(infoBlocks).where(eq(infoBlocks.pageId, pageId)),
    getScrapedContext(pageId, page),
  ]);

  // Read page settings for newspaper customization
  const settings = (page.pageSettings as PageSettings | null)?.newspaper;

  const context = [
    `Name: ${page.displayName}`,
    `Bio: ${page.bio || 'No bio'}`,
    `Links: ${pageLinks.map((l) => `${l.title} (${l.url})`).join(', ') || 'None'}`,
    `Projects: ${pageProjects.map((p) => `${p.title}: ${p.description}`).join('\n') || 'None'}`,
    ...blocks.map((b) => `${b.title || b.type}: ${b.content}`),
    ...(settings?.context ? [`Additional context from the person: ${settings.context}`] : []),
    ...(scrapedContext ? [scrapedContext] : []),
  ].join('\n\n');

  // Build system prompt with tone and name preferences
  let systemPrompt = NEWSPAPER_SYSTEM_PROMPT;
  const promptAdditions: string[] = [];

  if (settings?.name) {
    promptAdditions.push(`Use "${settings.name}" as the newspaper masthead name instead of generating one.`);
  }
  if (settings?.tone && settings.tone !== 'Prestigious') {
    promptAdditions.push(`Write in a "${settings.tone}" newspaper tone. ${
      settings.tone === 'Tabloid'
        ? 'Use sensational headlines, exclamation marks, and dramatic language like a tabloid paper.'
        : settings.tone === 'Local'
          ? 'Write in a warm, community-focused local newspaper style. Make it feel homey and personal.'
          : ''
    }`);
  }

  if (promptAdditions.length > 0) {
    systemPrompt += '\n\nIMPORTANT: ' + promptAdditions.join(' ');
  }

  try {
    const raw = await generateCompletion(
      user.smApiKey,
      user.smIndexId,
      `Write a newspaper front page about this person:\n\n${context}`,
      systemPrompt
    );

    const newspaper = parseAIResponse<NewspaperContent>(raw);

    // Upsert generated page
    const existing = await db
      .select()
      .from(generatedPages)
      .where(
        and(
          eq(generatedPages.pageId, pageId),
          eq(generatedPages.type, 'newspaper')
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(generatedPages)
        .set({
          content: asGeneratedPageContent(newspaper),
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(generatedPages.id, existing[0].id));
    } else {
      await db.insert(generatedPages).values({
        pageId,
        type: 'newspaper',
        content: asGeneratedPageContent(newspaper),
        status: 'ready',
      });
    }

    return Response.json(newspaper);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to generate newspaper' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
