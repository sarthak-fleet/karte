import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import { links, pages } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { requireUser } from '@/lib/api-auth';
import { isBlockedUrl, MAX_IMPORT_LINKS } from '@/lib/link-import';
import { resolveThemeConfig } from '@/lib/themes';
import { isValidSlug, isValidUrl, MAX_TITLE_LENGTH } from '@/lib/validation';

// ── Wow cards shape returned to /welcome client ─────────────────────
interface WowCards {
  headline: string;
  roast: string;
  questions: Array<{ q: string; a: string }>;
}

interface IncomingLink {
  title: string;
  url: string;
}

// Slug normalizer matching server-side rules — lowercase, alphanumeric
// + hyphens, 3-50 chars. Email usernames frequently violate this, so
// strip dots/plus tags first.
function slugFromEmail(email: string | undefined | null): string {
  if (!email) return 'profile';
  const localPart = email.split('@')[0] ?? 'profile';
  return localPart
    .toLowerCase()
    .replace(/\+.*$/, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'profile';
}

function slugFromName(name: string | undefined | null): string {
  if (!name) return 'profile';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40) || 'profile';
}

async function findUniqueSlug(base: string): Promise<string> {
  const candidate = isValidSlug(base) ? base : 'profile';
  const [existing] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, candidate)).limit(1);
  if (!existing) return candidate;

  // Try short numeric suffixes; falls back to random hex on the off
  // chance someone else hits the same name on the same suffix.
  for (let i = 0; i < 6; i++) {
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    const next = `${candidate.slice(0, 40 - 5)}-${suffix}`;
    if (!isValidSlug(next)) continue;
    const [taken] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, next)).limit(1);
    if (!taken) return next;
  }
  return `${candidate}-${Date.now().toString(36).slice(-6)}`;
}

function sanitizeIncomingLinks(input: unknown): IncomingLink[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item): IncomingLink | null => {
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
    .filter((item): item is IncomingLink => Boolean(item))
    .slice(0, MAX_IMPORT_LINKS);
}

// ── Card generation ─────────────────────────────────────────────────
const SYSTEM = `You write welcome-screen previews for a new user who just imported their link-in-bio into Karte (an AI-augmented profile platform). Your job is to make them feel "Linktree couldn't do this."

Return ONLY a single JSON object — no prose, no markdown fences. Schema:
{
  "headline": string,
  "roast": string,
  "questions": [{ "q": string, "a": string }, { "q": string, "a": string }, { "q": string, "a": string }]
}

Style:
- headline: 5-10 word breaking-news-style headline ABOUT the person, written like a newspaper front page. Confident, a little dramatic, not corny. Example: "Builder Of Three Untracked Startups Resurfaces."
- roast: ONE warm, playful sentence (max 16 words) about their link collection. No mean-spirited content.
- questions: 3 questions a real visitor to this profile would ask, and a plausible 1-sentence answer in the user's voice. Reference specific links by domain when possible. Each q ≤ 9 words; each a ≤ 28 words.`;

function buildUserPrompt(opts: {
  displayName: string;
  links: IncomingLink[];
  sourceUrl: string;
}): string {
  const linksList =
    opts.links.length === 0
      ? '(none — they started from scratch)'
      : opts.links
          .slice(0, 14)
          .map((l) => `- ${l.title} → ${l.url}`)
          .join('\n');
  return `Display name: ${opts.displayName}
Imported from: ${opts.sourceUrl || '(unknown)'}
Links (${opts.links.length}):
${linksList}

Return the JSON now.`;
}

function parseCards(raw: string): WowCards | null {
  // Models occasionally wrap in code fences despite the system prompt;
  // pluck the first JSON object out.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const headline = typeof record.headline === 'string' ? record.headline.trim() : '';
    const roast = typeof record.roast === 'string' ? record.roast.trim() : '';
    const rawQuestions = Array.isArray(record.questions) ? record.questions : [];
    const questions = rawQuestions
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const r = item as Record<string, unknown>;
        const q = typeof r.q === 'string' ? r.q.trim() : '';
        const a = typeof r.a === 'string' ? r.a.trim() : '';
        if (!q || !a) return null;
        return { q, a };
      })
      .filter((x): x is { q: string; a: string } => x !== null)
      .slice(0, 3);
    if (!headline || !roast || questions.length === 0) return null;
    return { headline, roast, questions };
  } catch {
    return null;
  }
}

function fallbackCards(opts: { displayName: string; links: IncomingLink[] }): WowCards {
  // Used when AI is unavailable or returns garbage. Still concrete,
  // still references the imported data — not a generic stock string.
  const firstName = opts.displayName.split(' ')[0] || opts.displayName;
  const sample = opts.links[0]?.title || 'their work';
  return {
    headline: `${opts.displayName} Goes Live On Karte.`.toUpperCase(),
    roast: `${opts.links.length} links and the only one we trust is ${sample.toLowerCase()}.`,
    questions: [
      {
        q: 'What is this profile?',
        a: `Hi — I'm ${firstName}. This Karte page is the one-stop link for what I'm building, where to reach me, and what I'm open to.`,
      },
      {
        q: 'Are you taking on new work?',
        a: 'Selectively. Drop a note via the contact link above and I get back within a few days.',
      },
      {
        q: 'Is your stuff open-source?',
        a: 'Some of it is — check the GitHub link. The rest is product I run.',
      },
    ],
  };
}

async function generateCards(opts: {
  displayName: string;
  links: IncomingLink[];
  sourceUrl: string;
}): Promise<WowCards> {
  const config = resolveAiConfig();
  if (!config) return fallbackCards(opts);

  try {
    const raw = await generate(config, {
      system: SYSTEM,
      prompt: buildUserPrompt(opts),
      reasoningLevel: 'fast',
    });
    const parsed = parseCards(raw);
    return parsed ?? fallbackCards(opts);
  } catch {
    return fallbackCards(opts);
  }
}

// ── Handler ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  await ensureProjectsTable();

  const body = (await req.json().catch(() => ({}))) as {
    sourceUrl?: string;
    links?: unknown;
  };
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
  const incomingLinks = sanitizeIncomingLinks(body.links);

  // Step 1 — find or create the user's page.
  let [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.userId, auth.userId))
    .limit(1);

  if (!page) {
    const seed =
      slugFromName(auth.user.name) || slugFromEmail(auth.user.email);
    const slug = await findUniqueSlug(seed);
    const displayName = (auth.user.name || seed).slice(0, MAX_TITLE_LENGTH);
    const [created] = await db
      .insert(pages)
      .values({
        userId: auth.userId,
        slug,
        displayName,
        bio: null,
        avatarUrl: auth.user.image ?? null,
        themeConfig: resolveThemeConfig(),
        chatEnabled: true,
      })
      .returning();
    page = created;
  }

  if (!page) {
    return NextResponse.json({ error: 'Failed to provision page' }, { status: 500 });
  }

  // Step 2 — bulk-import links, deduping by URL.
  let importedCount = 0;
  if (incomingLinks.length > 0) {
    const existingLinks = await db
      .select({ url: links.url })
      .from(links)
      .where(eq(links.pageId, page.id));
    const existingUrls = new Set(existingLinks.map((l) => l.url));

    const [maxLink] = await db
      .select({ sortOrder: links.sortOrder })
      .from(links)
      .where(eq(links.pageId, page.id))
      .orderBy(desc(links.sortOrder))
      .limit(1);
    const startOrder = (maxLink?.sortOrder ?? -1) + 1;

    const toInsert = incomingLinks
      .filter((item) => !existingUrls.has(item.url))
      .map((item, idx) => ({
        pageId: page.id,
        title: item.title,
        url: item.url,
        sortOrder: startOrder + idx,
        enabled: true,
      }));

    if (toInsert.length > 0) {
      const inserted = await db.insert(links).values(toInsert).returning();
      importedCount = inserted.length;
    }
  }

  // Step 3 — generate the wow cards from whatever the page now contains.
  // If the import added new links we use those; otherwise we fall back
  // to whatever was already on the page.
  const linksForGen =
    incomingLinks.length > 0
      ? incomingLinks
      : (
          await db
            .select({ title: links.title, url: links.url })
            .from(links)
            .where(and(eq(links.pageId, page.id), eq(links.enabled, true)))
            .limit(20)
        ).map((l) => ({ title: l.title, url: l.url }));

  const cards = await generateCards({
    displayName: page.displayName,
    links: linksForGen,
    sourceUrl,
  });

  return NextResponse.json({
    slug: page.slug,
    displayName: page.displayName,
    importedCount,
    cards,
  });
}
