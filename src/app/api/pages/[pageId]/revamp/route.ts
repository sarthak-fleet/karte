import { and, asc, desc, eq, inArray, like, notLike } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureProjectsTable } from '@/db';
import {
  infoBlocks,
  links,
  pageSections,
  pages,
  projects,
  users,
} from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { isPageSectionType, type PageSectionType } from '@/lib/page-sections';
import {
  isThemePresetId,
  resolveThemeConfig,
  THEME_PRESETS,
  type ThemePresetId,
} from '@/lib/themes';

type RevampBlock = {
  type: PageSectionType;
  title: string;
  content: string;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
};

type CustomColors = {
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
};

type RevampPlan = {
  themePresetId: ThemePresetId;
  customColors?: CustomColors;
  headline: string;
  rationale: string;
  emphasis: string[];
  blocks: RevampBlock[];
  // IDs of existing pageSections to remove. Safe because the
  // preview-then-apply flow lets the owner see what's slated for
  // deletion before committing. Server validates that each ID actually
  // belongs to the page being revamped before deleting.
  removeSectionIds: string[];
};

const REVAMP_TITLE_PREFIX = 'AI Revamp:';

function clampText(value: unknown, fallback: string, max = 900) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : fallback;
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1];

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim());
}

function normalizePlan(value: unknown): RevampPlan {
  const source =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const requestedTheme =
    typeof source.themePresetId === 'string' ? source.themePresetId : '';
  const themePresetId = isThemePresetId(requestedTheme)
    ? requestedTheme
    : 'midnight';

  const rawColors = source.customColors;
  let customColors: CustomColors | undefined;
  if (rawColors && typeof rawColors === 'object') {
    const c = rawColors as Record<string, unknown>;
    if (
      isHexColor(c.gradientFrom) &&
      isHexColor(c.gradientTo) &&
      isHexColor(c.accentColor)
    ) {
      customColors = {
        gradientFrom: c.gradientFrom.trim(),
        gradientTo: c.gradientTo.trim(),
        accentColor: c.accentColor.trim(),
      };
    }
  }
  const rawBlocks = Array.isArray(source.blocks) ? source.blocks : [];
  const blocks = rawBlocks
    .map((raw): RevampBlock | null => {
      if (!raw || typeof raw !== 'object') return null;
      const block = raw as Record<string, unknown>;
      const type =
        typeof block.type === 'string' && isPageSectionType(block.type)
          ? block.type
          : 'text';
      const title = `${REVAMP_TITLE_PREFIX} ${clampText(block.title, 'Featured direction', 70).replace(/^AI Revamp:\s*/i, '')}`;
      const content = clampText(
        block.content,
        'A focused profile block generated from the current profile context.',
        type === 'blog' ? 1600 : 900,
      );
      const buttonLabel =
        type === 'cta' ? clampText(block.buttonLabel, 'Start here', 40) : null;
      const buttonUrl =
        type === 'cta' &&
        typeof block.buttonUrl === 'string' &&
        /^https?:\/\//.test(block.buttonUrl)
          ? block.buttonUrl
          : null;

      if (type === 'cta' && !buttonUrl) return null;

      return { type, title, content, buttonLabel, buttonUrl };
    })
    .filter((block): block is RevampBlock => Boolean(block))
    .slice(0, 3);

  if (blocks.length === 0) {
    blocks.push({
      type: 'text',
      title: `${REVAMP_TITLE_PREFIX} Start here`,
      content:
        'A tighter intro block that explains who this page is for, what to open first, and why visitors should start a conversation.',
      buttonLabel: null,
      buttonUrl: null,
    });
  }

  const emphasis = Array.isArray(source.emphasis)
    ? source.emphasis
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : ['Links', 'Chat', 'Projects', 'Writing'];

  const removeSectionIds = Array.isArray(source.removeSectionIds)
    ? source.removeSectionIds
        .filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        )
        .map((id) => id.trim())
        .slice(0, 12)
    : [];

  return {
    themePresetId,
    ...(customColors ? { customColors } : {}),
    headline: clampText(source.headline, 'Sharper profile narrative', 90),
    rationale: clampText(
      source.rationale,
      'This revamp keeps the page structured but makes the primary visitor path clearer.',
      600,
    ),
    emphasis,
    blocks,
    removeSectionIds,
  };
}

function fallbackPlan(
  prompt: string,
  page: typeof pages.$inferSelect,
): RevampPlan {
  const lower = prompt.toLowerCase();
  const themePresetId: ThemePresetId =
    lower.includes('weird') || lower.includes('fun')
      ? 'terminal'
      : lower.includes('writer') ||
          lower.includes('blog') ||
          lower.includes('editorial')
        ? 'editorial'
        : lower.includes('creative') || lower.includes('creator')
          ? 'studio'
          : 'midnight';
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    'https://karte.cc';

  return {
    themePresetId,
    headline: `${page.displayName} as a clearer personal site`,
    rationale:
      'Lead with links and chat, then use projects, writing, and generated modes as supporting proof. Keep the page polished enough for professional visitors while preserving shareability.',
    emphasis: [
      'Find Me Online',
      'Chat',
      'Projects',
      'Writing',
      'Generated modes',
    ],
    removeSectionIds: [],
    blocks: [
      {
        type: 'text',
        title: `${REVAMP_TITLE_PREFIX} Best place to start`,
        content:
          'Start with the links if you want the fastest context, the projects if you want proof of work, and chat if you want a direct answer from the profile.',
      },
      {
        type: 'cta',
        title: `${REVAMP_TITLE_PREFIX} Reach out with context`,
        content:
          'For serious conversations, send a verified message with what you are building, hiring for, or trying to understand.',
        buttonLabel: 'Send a message',
        buttonUrl: `${appUrl.replace(/\/+$/, '')}/${page.slug}`,
      },
    ],
  };
}

async function generatePlan(opts: {
  prompt: string;
  page: typeof pages.$inferSelect;
  pageLinks: Array<typeof links.$inferSelect>;
  pageProjects: Array<typeof projects.$inferSelect>;
  sections: Array<typeof pageSections.$inferSelect>;
  memoryBlocks: Array<typeof infoBlocks.$inferSelect>;
  aiConfig: ReturnType<typeof resolveAiConfig>;
}) {
  const {
    prompt,
    page,
    pageLinks,
    pageProjects,
    sections,
    memoryBlocks,
    aiConfig,
  } = opts;
  if (!aiConfig) return fallbackPlan(prompt, page);

  const result = await generate(aiConfig, {
    system: `You are a product-minded profile designer for Karte.
Return only valid JSON. Do not use markdown.
You must choose a themePresetId from: ${THEME_PRESETS.map((theme) => `${theme.id} (${theme.description})`).join(', ')}.
If the user requests a specific color scheme or visual style not well served by the presets, you may also include a "customColors" object with gradientFrom, gradientTo, and accentColor fields as 6-digit hex codes (e.g. "#8b00ff"). Custom colors override the preset's colors. Only include customColors if the user's design intent clearly calls for it.
You may recommend at most 3 new public blocks.
Allowed block types: text, blog, cta, social, testimonial, contact.
Every block title must be short. Blog content format is one post per line: Title | URL | Short description | Date.
CTA blocks require buttonLabel and an absolute https URL.

REMOVALS: when the user's prompt explicitly asks to remove, drop, or hide a section ("remove the writing section", "drop the testimonials", "hide the contact form"), include the matching pageSections IDs in "removeSectionIds". Match by section title/type from the page state below. Only include IDs that appear in that list. Never invent IDs. If the user doesn't ask for removals, leave removeSectionIds empty.

Prefer additive changes when the prompt is purely about vibe/theme. The owner sees a preview before anything is removed, so honest removal proposals are safe.`,
    reasoningLevel: 'deep',
    prompt: JSON.stringify({
      requestedRevamp: prompt,
      page: {
        displayName: page.displayName,
        bio: page.bio,
        themeConfig: page.themeConfig,
        dmMode: page.dmMode,
        chatEnabled: page.chatEnabled,
      },
      links: pageLinks.map((item) => ({ title: item.title, url: item.url })),
      projects: pageProjects.map((item) => ({
        title: item.title,
        url: item.url,
        description: item.description,
      })),
      sections: sections.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content,
      })),
      memory: memoryBlocks.map((item) => ({
        type: item.type,
        title: item.title,
        content: item.content.slice(0, 600),
      })),
      requiredJsonShape: {
        themePresetId: 'midnight',
        customColors:
          '(optional) { gradientFrom: "#hex", gradientTo: "#hex", accentColor: "#hex" } — only include if user requested a specific color scheme',
        headline: 'Short name for the revamp',
        rationale: 'Why this structure works',
        emphasis: ['ordered list of public blocks to emphasize'],
        removeSectionIds: [
          '(optional) list of pageSection IDs from `sections` above that the user explicitly asked to remove',
        ],
        blocks: [
          {
            type: 'text',
            title: 'Short block title',
            content: 'Public block content',
            buttonLabel: null,
            buttonUrl: null,
          },
        ],
      },
    }),
  });

  try {
    return normalizePlan(JSON.parse(extractJson(result)));
  } catch {
    return fallbackPlan(prompt, page);
  }
}

// Note: revamp() uses generate() above. Reasoning level for revamp
// is 'deep' since it's a one-shot full-page redesign where output
// quality dominates UX. Added directly to the generate() call.

async function applyPlan(pageId: string, plan: RevampPlan) {
  // D1 rejects drizzle's BEGIN/COMMIT transactions. We instead:
  //   1. Read the max sortOrder of NON-revamp sections up front
  //      (the old revamp rows are about to be deleted anyway).
  //   2. Validate that each removeSectionIds entry actually belongs
  //      to this page so the AI can't be tricked into deleting
  //      somebody else's data.
  //   3. Run the UPDATE + DELETE(revamp prefix) + DELETE(by ID) +
  //      INSERTs as a single atomic batch.
  // The pre-batch read is the trade-off — a concurrent insert between
  // the read and the batch could collide on sortOrder, but revamp is
  // a per-page, per-user action so contention is effectively zero.
  const [maxSection] = await db
    .select({ sortOrder: pageSections.sortOrder })
    .from(pageSections)
    .where(
      and(
        eq(pageSections.pageId, pageId),
        notLike(pageSections.title, `${REVAMP_TITLE_PREFIX}%`),
      ),
    )
    .orderBy(desc(pageSections.sortOrder))
    .limit(1);

  const startOrder = (maxSection?.sortOrder ?? -1) + 1;

  let removableIds: string[] = [];
  if (plan.removeSectionIds.length > 0) {
    const ownedRows = await db
      .select({ id: pageSections.id })
      .from(pageSections)
      .where(
        and(
          eq(pageSections.pageId, pageId),
          inArray(pageSections.id, plan.removeSectionIds),
        ),
      );
    removableIds = ownedRows.map((row) => row.id);
  }

  const writes = [
    db
      .update(pages)
      .set({
        themeConfig: resolveThemeConfig({
          presetId: plan.themePresetId,
          ...(plan.customColors ?? {}),
        }),
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId)),
    db
      .delete(pageSections)
      .where(
        and(
          eq(pageSections.pageId, pageId),
          like(pageSections.title, `${REVAMP_TITLE_PREFIX}%`),
        ),
      ),
    ...(removableIds.length > 0
      ? [
          db
            .delete(pageSections)
            .where(
              and(
                eq(pageSections.pageId, pageId),
                inArray(pageSections.id, removableIds),
              ),
            ),
        ]
      : []),
    ...plan.blocks.map((block, index) =>
      db.insert(pageSections).values({
        pageId,
        type: block.type,
        title: block.title,
        content: block.content,
        buttonLabel: block.type === 'cta' ? (block.buttonLabel ?? null) : null,
        buttonUrl: block.type === 'cta' ? (block.buttonUrl ?? null) : null,
        sortOrder: startOrder + index,
        enabled: true,
      }),
    ),
  ];

  await db.batch(writes as [(typeof writes)[number], ...typeof writes]);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { pageId } = await params;
  await ensureProjectsTable();

  const page = await loadOwnedPage(pageId, auth.userId);
  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const prompt = clampText(
    body.prompt,
    'Make my profile clearer and more commercially polished.',
    1200,
  );
  const shouldApply = Boolean(body.apply);

  try {
    const [pageLinks, pageProjects, sections, memoryBlocks, user] =
      await Promise.all([
        db
          .select()
          .from(links)
          .where(eq(links.pageId, pageId))
          .orderBy(asc(links.sortOrder)),
        db
          .select()
          .from(projects)
          .where(eq(projects.pageId, pageId))
          .orderBy(asc(projects.sortOrder)),
        db
          .select()
          .from(pageSections)
          .where(eq(pageSections.pageId, pageId))
          .orderBy(asc(pageSections.sortOrder)),
        db
          .select()
          .from(infoBlocks)
          .where(eq(infoBlocks.pageId, pageId))
          .orderBy(asc(infoBlocks.sortOrder)),
        db.query.users.findFirst({ where: eq(users.id, auth.userId) }),
      ]);

    const incomingPlan = body.plan ? normalizePlan(body.plan) : null;
    const plan =
      incomingPlan ??
      (await generatePlan({
        prompt,
        page,
        pageLinks,
        pageProjects,
        sections,
        memoryBlocks,
        aiConfig: resolveAiConfig(user),
      }));

    if (shouldApply) {
      await applyPlan(pageId, plan);
    }

    // Resolve the IDs the AI proposed to remove into display data
    // (title + type) so the dashboard's preview panel can show what
    // would actually go. The intersection with `sections` here is the
    // same validation applyPlan does — IDs that don't belong to the
    // page get silently dropped.
    const removedSections =
      plan.removeSectionIds.length > 0
        ? sections
            .filter((s) => plan.removeSectionIds.includes(s.id))
            .map((s) => ({ id: s.id, title: s.title, type: s.type }))
        : [];

    return NextResponse.json({ plan, applied: shouldApply, removedSections });
  } catch (error) {
    // Any throw from generate(), applyPlan(), or the DB reads above
    // would otherwise become a framework-default 500 with an empty
    // body on Cloudflare Workers — the client then errors on
    // `await res.json()` with "Unexpected end of JSON input".
    console.error('revamp_failed', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error:
          'Could not generate a revamp right now. Try a shorter prompt or try again.',
      },
      { status: 502 },
    );
  }
}
