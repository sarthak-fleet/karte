import { db, ensureProjectsTable } from '@/db';
import { pages, users, infoBlocks, links, projects, generatedPages } from '@/db/schema';
import type { PageSettings } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createAIModel, type AIConfig } from '@saas-maker/ai/server';
import { generateText } from 'ai';
import { parseAIResponse } from '@/lib/saasmaker';
import { ENCYCLOPEDIA_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { rateLimit } from '@/lib/rate-limit';
import { asGeneratedPageContent, type EncyclopediaContent } from '@/lib/generated-page-types';
import { getScrapedContext } from '@/lib/scrape-page-content';

export async function POST(req: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(`encyclopedia:${ip}`, { windowMs: 3_600_000, maxRequests: 3 });
  if (!ok) return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });

  await ensureProjectsTable();

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page || !page.encyclopediaEnabled) {
    return new Response(JSON.stringify({ error: 'Encyclopedia not enabled' }), { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));
  if (!user?.aiEndpointUrl || !user?.aiApiKey || !user?.aiModel) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
  }

  const aiConfig: AIConfig = {
    endpointUrl: user.aiEndpointUrl,
    apiKey: user.aiApiKey,
    model: user.aiModel,
  };

  // Fetch all context + scraped content in parallel
  const [blocks, pageLinks, pageProjects, scrapedContext] = await Promise.all([
    db.select().from(infoBlocks).where(eq(infoBlocks.pageId, pageId)),
    db.select().from(links).where(eq(links.pageId, pageId)).orderBy(asc(links.sortOrder)),
    db.select().from(projects).where(eq(projects.pageId, pageId)).orderBy(asc(projects.sortOrder)),
    getScrapedContext(pageId, page),
  ]);

  // Read page settings for encyclopedia customization
  const settings = (page.pageSettings as PageSettings | null)?.encyclopedia;

  const context = [
    `Name: ${page.displayName}`,
    `Bio: ${page.bio || 'No bio'}`,
    `Links: ${pageLinks.map((l) => `${l.title} (${l.url})`).join(', ') || 'None'}`,
    `Projects: ${pageProjects.map((p) => `${p.title}: ${p.description}`).join('\n') || 'None'}`,
    ...blocks.map((b) => `${b.title || b.type}: ${b.content}`),
    ...(settings?.context ? [`Additional context from the person: ${settings.context}`] : []),
    ...(scrapedContext ? [scrapedContext] : []),
  ].join('\n\n');

  // Build system prompt with style preference
  let systemPrompt = ENCYCLOPEDIA_SYSTEM_PROMPT;
  if (settings?.style && settings.style !== 'Formal Wikipedia') {
    systemPrompt += `\n\nIMPORTANT: Write in a "${settings.style}" style. ${
      settings.style === 'Casual'
        ? 'Use a conversational, relaxed tone. Less formal than Wikipedia — more like an entertaining blog post in encyclopedia format.'
        : settings.style === 'Academic'
          ? 'Use rigorous academic language with proper citations-style references, formal analysis, and scholarly framing.'
          : ''
    }`;
  }

  try {
    const { text: raw } = await generateText({
      model: createAIModel(aiConfig),
      system: systemPrompt,
      prompt: `Write a Wikipedia-style encyclopedia article about this person:\n\n${context}`,
    });

    const encyclopedia = parseAIResponse<EncyclopediaContent>(raw);

    // Upsert
    const existing = await db
      .select()
      .from(generatedPages)
      .where(and(eq(generatedPages.pageId, pageId), eq(generatedPages.type, 'encyclopedia')))
      .limit(1);

    if (existing[0]) {
      await db
        .update(generatedPages)
        .set({ content: asGeneratedPageContent(encyclopedia), status: 'ready', updatedAt: new Date() })
        .where(eq(generatedPages.id, existing[0].id));
    } else {
      await db.insert(generatedPages).values({
        pageId,
        type: 'encyclopedia',
        content: asGeneratedPageContent(encyclopedia),
        status: 'ready',
      });
    }

    return Response.json(encyclopedia);
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to generate encyclopedia' }), { status: 500 });
  }
}
