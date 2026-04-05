export type GeneratedPageType = 'encyclopedia' | 'roast' | 'newspaper';
export type GeneratedPageStatus = 'pending' | 'generating' | 'ready' | 'error';

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

export interface NewspaperContent {
  mastheadName: string;
  dateline: string;
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

export function asGeneratedPageContent(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}
