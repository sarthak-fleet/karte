import { db } from '@/db';
import { pages, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { search } from '@/lib/saasmaker';
import { createAIModel, type AIConfig } from '@saas-maker/ai/server';
import { streamText } from 'ai';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(ip);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  const body = await req.json();
  const { query } = body;

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'query required' }), { status: 400 });
  }

  // Get page + user config
  const [page] = await db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.published, true)));
  if (!page || !page.chatEnabled) {
    return new Response(JSON.stringify({ error: 'Chat not available' }), { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, page.userId));

  // Need SaaS Maker for RAG retrieval AND custom AI endpoint for generation
  if (!user?.smApiKey || !user?.smIndexId) {
    return new Response(JSON.stringify({ error: 'Chat not configured — document index missing' }), { status: 503 });
  }
  if (!user?.aiEndpointUrl || !user?.aiApiKey || !user?.aiModel) {
    return new Response(JSON.stringify({ error: 'Chat not configured — AI endpoint missing' }), { status: 503 });
  }

  const aiConfig: AIConfig = {
    endpointUrl: user.aiEndpointUrl,
    apiKey: user.aiApiKey,
    model: user.aiModel,
  };

  try {
    // Step 1: Retrieve relevant context from SaaS Maker index
    const searchResults = await search(user.smApiKey, user.smIndexId, query, 5);
    const retrievedContext = searchResults.results
      .map((r) => r.chunk_content)
      .join('\n\n');

    // Step 2: Build system prompt with retrieved context
    const baseSystemPrompt = page.chatSystemPrompt
      || `You are a helpful assistant that answers questions about ${page.displayName}. Use only the provided context to answer. If you don't know, say so.`;

    const systemPrompt = retrievedContext
      ? `${baseSystemPrompt}\n\nContext from the knowledge base:\n${retrievedContext}`
      : baseSystemPrompt;

    // Step 3: Stream LLM response via custom AI endpoint
    const result = streamText({
      model: createAIModel(aiConfig),
      system: systemPrompt,
      prompt: query,
    });
    return result.toTextStreamResponse();
  } catch {
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), { status: 502 });
  }
}
