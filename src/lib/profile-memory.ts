import { asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import type { pages } from '@/db/schema';
import {
  infoBlocks,
  links,
  type PageSettings,
  projects,
  timelineEvents,
} from '@/db/schema';
import { getScrapedContext } from '@/lib/scrape-page-content';
import { TIMELINE_TYPE_LABELS } from '@/lib/timeline';

type PageRecord = typeof pages.$inferSelect;

export type ProfileMemoryMode = 'chat' | 'encyclopedia' | 'newspaper' | 'roast';

export type ProfileMemorySource = {
  id: string;
  type:
    | 'identity'
    | 'intent'
    | 'memory'
    | 'link'
    | 'project'
    | 'scraped'
    | 'instruction'
    | 'timeline';
  label: string;
  title: string;
  content: string;
  url?: string;
  priority: number;
};

export type ProfileMemoryQuality = {
  hasEnoughForRichGeneration: boolean;
  sourceCount: number;
  missing: string[];
  suggestions: string[];
};

export type ProfileMemory = {
  pageName: string;
  mode: ProfileMemoryMode;
  sources: ProfileMemorySource[];
  quality: ProfileMemoryQuality;
  promptContext: string;
};

const MODE_LABELS: Record<ProfileMemoryMode, string> = {
  chat: 'Chat profile memory',
  encyclopedia: 'Encyclopedia source file',
  newspaper: 'Newspaper source desk',
  roast: 'Roast research packet',
};

const TYPE_LABELS: Record<string, string> = {
  text: 'About',
  about: 'About',
  resume: 'Resume',
  faq: 'FAQ',
  current: 'Current Focus',
  voice: 'Voice and Style',
  boundaries: 'Boundaries',
};

function cleanText(value: string | null | undefined, maxLength = 2400): string {
  if (!value) return '';
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function labelForType(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/[-_]/g, ' ');
}

function formatSources(sources: ProfileMemorySource[]): string {
  return sources
    .sort((a, b) => b.priority - a.priority)
    .map((source, index) => {
      const url = source.url ? `\nURL: ${source.url}` : '';
      return `[S${index + 1}] ${source.label}: ${source.title}${url}\n${source.content}`;
    })
    .join('\n\n');
}

function getModeInstruction(
  mode: ProfileMemoryMode,
  settings: PageSettings | null | undefined,
): string {
  if (mode === 'chat') {
    return [
      'Answer as a helpful profile assistant.',
      'Use the source cards below as the primary memory.',
      'If a visitor asks for something not covered by the memory, say what is missing instead of inventing it.',
      'Mention links, projects, or contact paths when they directly help the visitor.',
    ].join(' ');
  }

  if (mode === 'encyclopedia') {
    const style = settings?.encyclopedia?.style;
    return [
      'Write a source-backed profile encyclopedia entry.',
      'Use neutral language and omit sections that have no evidence.',
      'Do not fabricate dates, birthplace, education, employers, awards, or personal history.',
      style ? `Preferred article style: ${style}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (mode === 'newspaper') {
    const tone = settings?.newspaper?.tone;
    return [
      'Write a lively front page using only profile-backed details.',
      'Make headlines dramatic, but keep factual claims grounded in the source cards.',
      'If the data is thin, turn the angle into a tasteful profile story rather than making up achievements.',
      tone ? `Preferred newspaper tone: ${tone}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  const tone = settings?.roast?.tone;
  return [
    'Write comedy from specific, source-backed details.',
    'Punch up at the public profile, not at protected traits, private attributes, trauma, or identity.',
    'If evidence is thin, joke about the profile being mysterious instead of inventing embarrassing facts.',
    tone ? `Preferred roast tone: ${tone}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function getModeContext(
  mode: ProfileMemoryMode,
  settings: PageSettings | null | undefined,
): string {
  if (mode === 'encyclopedia')
    return cleanText(settings?.encyclopedia?.context, 1600);
  if (mode === 'newspaper')
    return cleanText(settings?.newspaper?.context, 1600);
  if (mode === 'roast') return cleanText(settings?.roast?.context, 1600);
  return '';
}

function getQuality(
  page: PageRecord,
  sources: ProfileMemorySource[],
): ProfileMemoryQuality {
  const memoryCount = sources.filter(
    (source) => source.type === 'memory',
  ).length;
  const projectCount = sources.filter(
    (source) => source.type === 'project',
  ).length;
  const linkCount = sources.filter((source) => source.type === 'link').length;
  const scrapedCount = sources.filter(
    (source) => source.type === 'scraped',
  ).length;

  const missing: string[] = [];
  const suggestions: string[] = [];

  if (!cleanText(page.bio)) {
    missing.push('bio');
    suggestions.push(
      'Add a concise bio that states who this profile is for and what the person is known for.',
    );
  }
  if (memoryCount < 2) {
    missing.push('memory blocks');
    suggestions.push(
      'Add at least two memory blocks: one for background and one for current work or FAQs.',
    );
  }
  if (projectCount === 0) {
    missing.push('projects');
    suggestions.push(
      'Add project entries with descriptions so generated modes have concrete material.',
    );
  }
  if (linkCount === 0) {
    missing.push('links');
    suggestions.push(
      'Add a primary website, social profile, portfolio, or contact link.',
    );
  }
  if (scrapedCount === 0) {
    suggestions.push(
      'Use descriptive link and project text because external page scraping may not add extra context.',
    );
  }

  return {
    hasEnoughForRichGeneration:
      memoryCount >= 2 &&
      (projectCount > 0 || linkCount > 1 || !!cleanText(page.bio)),
    sourceCount: sources.length,
    missing,
    suggestions,
  };
}

export async function buildProfileMemory({
  page,
  mode,
  query,
}: {
  page: PageRecord;
  mode: ProfileMemoryMode;
  query?: string;
}): Promise<ProfileMemory> {
  const settings = page.pageSettings as PageSettings | null | undefined;
  const [pageLinks, pageProjects, blocks, timeline, scrapedContext] =
    await Promise.all([
      db
        .select()
        .from(links)
        .where(eq(links.pageId, page.id))
        .orderBy(asc(links.sortOrder)),
      db
        .select()
        .from(projects)
        .where(eq(projects.pageId, page.id))
        .orderBy(asc(projects.sortOrder)),
      db
        .select()
        .from(infoBlocks)
        .where(eq(infoBlocks.pageId, page.id))
        .orderBy(asc(infoBlocks.sortOrder)),
      // Timeline events feed every AI surface with dated context.
      // Includes 'hidden' (in-memory but not on the public timeline)
      // so the chat can still answer "when did you join X?" even when
      // the user doesn't want a public pin. Excludes pending-review.
      db
        .select()
        .from(timelineEvents)
        .where(eq(timelineEvents.pageId, page.id))
        .orderBy(desc(timelineEvents.sortDate)),
      getScrapedContext(page.id, page),
    ]);

  const sources: ProfileMemorySource[] = [];
  const bio = cleanText(page.bio, 1800);
  sources.push({
    id: `page:${page.id}`,
    type: 'identity',
    label: 'Profile',
    title: page.displayName,
    content: bio || 'No profile bio has been provided yet.',
    priority: 100,
  });

  if (settings?.visitorIntent) {
    sources.push({
      id: `intent:${page.id}`,
      type: 'intent',
      label: 'Visitor Intent',
      title: settings.visitorIntent,
      content: `This profile is optimized for visitors who want to ${settings.visitorIntent}.`,
      priority: 95,
    });
  }

  // Page-level quick-action fields. These power generative-UI
  // components (BookCallSlot needs page.calendarUrl, LocationCard
  // needs page.location, etc.) so the AI has the real URLs to put
  // into props instead of inventing them or emitting empty objects.
  const quickActions: string[] = [];
  if (page.calendarUrl)
    quickActions.push(`Calendar booking link: ${page.calendarUrl}`);
  if (page.newsletterUrl)
    quickActions.push(`Newsletter signup: ${page.newsletterUrl}`);
  if (page.tipUrl) quickActions.push(`Tip / support link: ${page.tipUrl}`);
  if (page.videoUrl) quickActions.push(`Video embed: ${page.videoUrl}`);
  if (page.location) quickActions.push(`Based in: ${page.location}`);
  if (quickActions.length > 0) {
    sources.push({
      id: `quick-actions:${page.id}`,
      type: 'identity',
      label: 'Contact / Where',
      title: 'Quick actions',
      content: quickActions.join('\n'),
      priority: 97,
    });
  }

  for (const block of blocks) {
    sources.push({
      id: `memory:${block.id}`,
      type: 'memory',
      label: labelForType(block.type),
      title: block.title || labelForType(block.type),
      content: cleanText(block.content),
      priority: block.type === 'faq' ? 92 : block.type === 'resume' ? 90 : 88,
    });
  }

  // Timeline events — feed each as its own source so the AI can cite
  // specifics. Skip pending-review; include hidden so chat can still
  // answer "when did you..." even when the user opted them off the
  // public timeline render.
  for (const event of timeline.filter((t) => t.status !== 'pending-review')) {
    const verb = TIMELINE_TYPE_LABELS[event.type] || 'Note';
    const where = event.whereLabel ? ` — ${event.whereLabel}` : '';
    const body = event.body ? `\n${event.body}` : '';
    sources.push({
      id: `timeline:${event.id}`,
      type: 'timeline',
      label: 'Timeline',
      title: `${event.whenLabel}: ${verb} ${event.title}`,
      content: `${event.whenLabel} · ${verb}: ${event.title}${where}${body}`,
      url: event.link ?? undefined,
      // Just below memory/faq so dated context surfaces alongside
      // explicit FAQs but doesn't drown them out.
      priority: 86,
    });
  }

  for (const project of pageProjects.filter(
    (project) => project.enabled !== false,
  )) {
    sources.push({
      id: `project:${project.id}`,
      type: 'project',
      label: 'Project',
      title: project.title,
      content: cleanText(project.description, 1400),
      url: project.url,
      priority: 82,
    });
  }

  for (const link of pageLinks.filter((link) => link.enabled !== false)) {
    sources.push({
      id: `link:${link.id}`,
      type: 'link',
      label: 'Link',
      title: link.title,
      content: `Profile link titled "${link.title}".`,
      url: link.url,
      priority: 72,
    });
  }

  const modeContext = getModeContext(mode, settings);
  if (modeContext) {
    sources.push({
      id: `instruction:${mode}:${page.id}`,
      type: 'instruction',
      label: 'Creator Note',
      title: `${MODE_LABELS[mode]} note`,
      content: modeContext,
      priority: 98,
    });
  }

  if (scrapedContext) {
    sources.push({
      id: `scraped:${page.id}`,
      type: 'scraped',
      label: 'Linked Page Extracts',
      title: 'Scraped public context',
      content: cleanText(scrapedContext, 7000),
      priority: 65,
    });
  }

  const quality = getQuality(page, sources);
  const promptContext = [
    `${MODE_LABELS[mode]} for ${page.displayName}`,
    `Mode instruction: ${getModeInstruction(mode, settings)}`,
    query ? `Visitor question: ${query}` : '',
    `Source quality: ${quality.hasEnoughForRichGeneration ? 'rich enough' : 'thin; stay conservative'}. Missing: ${quality.missing.join(', ') || 'none detected'}.`,
    'Source cards:',
    formatSources(sources),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    pageName: page.displayName,
    mode,
    sources,
    quality,
    promptContext,
  };
}
