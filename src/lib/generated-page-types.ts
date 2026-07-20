export type GeneratedPageType = 'encyclopedia' | 'roast' | 'newspaper';

export interface EncyclopediaContent {
  /** Full article body as HTML (from Novel/Tiptap editor) */
  markdown: string;
  infobox: Record<string, string>;
  categories: string[];
}

export interface RoastContent {
  roast: string;
  vibeScore: number;
  personalityType: string;
  redFlags: string[];
  bestLink: { title: string; reason: string };
  worstLink: { title: string; reason: string };
  spiritPlatform: string;
  celebrityMatch: string;
  bioAutopsy: string;
  firstImpression: string;
}

// A single page of the newspaper. Multi-page issues are an array of
// these; legacy single-page content is treated as a one-element array
// at read time.
export interface NewspaperPage {
  /** Section title shown at the top of the page (e.g. 'Front Page',
   *  'Features', 'Opinion & Letters'). Defaults to 'Front Page'. */
  sectionLabel?: string;
  leadStory: {
    headline: string;
    subheadline: string;
    body: string;
    pullQuote: string;
  };
  secondaryStories: { headline: string; body: string }[];
  sidebar: { facts: string[]; mood: string };
  fakeAds: string[];
}

export interface NewspaperContent {
  mastheadName: string;
  dateline: string;
  /** Multi-page array. Backward-compat: when absent, treat the top-level
   *  leadStory / secondaryStories / sidebar / fakeAds fields as page 1. */
  pages?: NewspaperPage[];
  // Legacy single-page fields. Newly-generated content fills `pages`
  // and leaves these undefined. Older cached content (pre-multi-page)
  // populates these; the renderer wraps them into a one-element pages
  // array on read.
  leadStory?: {
    headline: string;
    subheadline: string;
    body: string;
    pullQuote: string;
  };
  secondaryStories?: { headline: string; body: string }[];
  sidebar?: { facts: string[]; mood: string };
  fakeAds?: string[];
}

/** Normalize legacy single-page content into an array of NewspaperPage. */
export function getNewspaperPages(content: NewspaperContent): NewspaperPage[] {
  if (content.pages && content.pages.length > 0) {
    return content.pages;
  }
  // Legacy fallback: wrap the top-level fields as a single page.
  if (content.leadStory) {
    return [
      {
        sectionLabel: 'Front Page',
        leadStory: content.leadStory,
        secondaryStories: content.secondaryStories ?? [],
        sidebar: content.sidebar ?? { facts: [], mood: '' },
        fakeAds: content.fakeAds ?? [],
      },
    ];
  }
  return [];
}

export function asGeneratedPageContent(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}
