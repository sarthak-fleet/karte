export type ProfileVariantId = 'baseline' | 'proof' | 'chat-first' | 'builder';

export type ProfileVariant = {
  id: ProfileVariantId;
  label: string;
  audience: string;
  eyebrow: string;
  primaryCta: string;
  hypothesis: string;
  promptOne: (firstName: string) => string;
  promptTwo: string;
};

export type VariantEvent = {
  eventType: string;
  metadata?: Record<string, unknown> | null;
};

export type VariantAnalytics = {
  id: string;
  views: number;
  conversions: number;
  conversionRate: number;
};

export const PROFILE_VARIANTS: ProfileVariant[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    audience: 'Default profile visitors',
    eyebrow: 'Personal site',
    primaryCta: 'Start chat',
    hypothesis: 'The current profile layout is the control for all traffic.',
    promptOne: (firstName) => `What is ${firstName} building?`,
    promptTwo: 'What should I know before reaching out?',
  },
  {
    id: 'proof',
    label: 'Social proof',
    audience: 'Recruiters, customers, and collaborators who need trust signals',
    eyebrow: 'Work worth checking',
    primaryCta: 'Ask about proof',
    hypothesis:
      'Leading with credibility should lift outbound clicks to projects and links.',
    promptOne: (firstName) => `What proof shows ${firstName} is good?`,
    promptTwo: 'Which project should I open first?',
  },
  {
    id: 'chat-first',
    label: 'Chat first',
    audience: 'Visitors who are more likely to ask than browse',
    eyebrow: 'Ask before you scroll',
    primaryCta: 'Ask the profile',
    hypothesis:
      'Making chat the primary action should lift chat CTA and DM conversions.',
    promptOne: (firstName) => `What should I ask ${firstName}?`,
    promptTwo: 'Summarize this profile for me.',
  },
  {
    id: 'builder',
    label: 'Builder mode',
    audience: 'Technical peers and operators evaluating current work',
    eyebrow: 'Built and shipped',
    primaryCta: 'Explore builds',
    hypothesis:
      'A build-focused frame should lift project-card and technical link clicks.',
    promptOne: (firstName) => `What is ${firstName} shipping right now?`,
    promptTwo: 'Show me the most technical work here.',
  },
];

const CONVERSION_EVENTS = new Set([
  'outbound_click',
  'contact_submit',
  'hook_open',
  'chat_cta_click',
  'dm_start',
  'dm_submit',
]);

export function getProfileVariant(value?: string | null) {
  return (
    PROFILE_VARIANTS.find((variant) => variant.id === value) ??
    PROFILE_VARIANTS[0]
  );
}

export function buildVariantPreviewUrl(
  slug: string,
  variantId: ProfileVariantId,
) {
  return variantId === 'baseline'
    ? `/${slug}`
    : `/${slug}?variant=${variantId}`;
}

export function summarizeVariantAnalytics(events: VariantEvent[]) {
  const summaries = new Map<string, VariantAnalytics>();

  function getSummary(id: string) {
    const existing = summaries.get(id);
    if (existing) {
      return existing;
    }

    const created = { id, views: 0, conversions: 0, conversionRate: 0 };
    summaries.set(id, created);
    return created;
  }

  for (const event of events) {
    const variantId =
      typeof event.metadata?.profileVariant === 'string'
        ? event.metadata.profileVariant
        : 'baseline';
    const summary = getSummary(variantId);

    if (event.eventType === 'page_view') {
      summary.views += 1;
    }

    if (CONVERSION_EVENTS.has(event.eventType)) {
      summary.conversions += 1;
    }
  }

  for (const summary of summaries.values()) {
    summary.conversionRate =
      summary.views > 0 ? summary.conversions / summary.views : 0;
  }

  return [...summaries.values()].sort(
    (a, b) => b.conversionRate - a.conversionRate,
  );
}
