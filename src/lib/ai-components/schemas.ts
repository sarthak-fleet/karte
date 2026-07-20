// Runtime schemas for each AI-emittable component's props.
//
// Replaces the hand-rolled sanitization in stream-parser.ts. Each
// schema is the source of truth for what props a component accepts;
// the AI's output is validated against the matching schema and
// rejected if it doesn't conform. Inferred TS types kept in sync
// via z.infer<>.

import { z } from 'zod';

const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), {
    message: 'Must be http(s) URL',
  });

// Visitor / AI layout intent. Cards that visitors most naturally ask
// to resize (projects, essays, timelines, metrics) accept this prop.
// 'md' is the default rendered size when absent.
const sizeProp = z.enum(['sm', 'md', 'lg']).optional();

const askAgainSchema = z.object({
  suggestions: z.array(z.string().min(1).max(120)).min(1).max(4),
});

const availabilityChipSchema = z.object({
  status: z.enum(['open', 'limited', 'closed']),
  label: z.string().max(120).optional(),
});

const bookCallSlotSchema = z.object({
  url: httpUrl,
  label: z.string().max(80).optional(),
  duration: z.string().max(40).optional(),
});

const essayLinkSchema = z.object({
  title: z.string().min(1).max(160),
  url: httpUrl,
  excerpt: z.string().max(400).optional(),
  year: z.string().max(16).optional(),
  size: sizeProp,
});

const hiringStatusSchema = z.object({
  status: z.enum(['open', 'fractional-only', 'advising-only', 'closed']),
  label: z.string().max(120).optional(),
});

const locationCardSchema = z.object({
  city: z.string().min(1).max(120),
  timezone: z.string().max(40).optional(),
  travelStatus: z.string().max(200).optional(),
});

const metricCardSchema = z.object({
  value: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  context: z.string().max(140).optional(),
  size: sizeProp,
});

const projectMiniSchema = z.object({
  title: z.string().min(1).max(120),
  url: httpUrl.optional(),
  description: z.string().max(280).optional(),
  imageUrl: z.string().url().nullable().optional(),
  size: sizeProp,
});

const quoteBlockSchema = z.object({
  quote: z.string().min(1).max(400),
  attribution: z.string().max(120).optional(),
});

const rateCardSchema = z.object({
  tier: z.string().min(1).max(80),
  price: z.string().min(1).max(40),
  slots: z.string().max(160).optional(),
  cta: z.string().max(80).optional(),
  url: httpUrl.optional(),
});

const stackListSchema = z.object({
  items: z.array(z.string().min(1).max(40)).min(1).max(20),
  label: z.string().max(60).optional(),
});

const timelineSliceSchema = z.object({
  events: z
    .array(
      z.object({
        when: z.string().min(1).max(40),
        title: z.string().min(1).max(160),
        where: z.string().max(120).optional(),
      }),
    )
    .min(1)
    .max(8),
  heading: z.string().max(80).optional(),
  size: sizeProp,
});

// Top-level layout directives the AI may emit after the components
// array. Applied to the AI's reply as a whole (this message only —
// the page itself is not mutated). Every field is optional; an empty
// or missing block means "use defaults."
export const layoutDirectivesSchema = z.object({
  // Visual density of the rendered components.
  density: z.enum(['compact', 'comfortable', 'magazine']).optional(),
  // Reorder the emitted components by an intent. 'recency' / 'impact'
  // are interpreted by the client based on prop content (year, value);
  // 'alphabetical' sorts by title-ish text.
  order: z.enum(['recency', 'impact', 'alphabetical']).optional(),
  // Soft text filter — components whose textual props don't match
  // (substring, case-insensitive) are dropped.
  filter: z.string().max(120).optional(),
  // Component types to drop from this reply (e.g. ['TimelineSlice']).
  hide: z.array(z.string().min(1).max(40)).max(12).optional(),
  // Visual mood — affects the wrapper's CSS variables only. Scoped to
  // the message; never mutates the page.
  mood: z.enum(['serious', 'playful', 'minimal', 'dark']).optional(),
});

// Discriminated union — pass any { type, props } and Zod validates
// against the matching schema. Unknown types fail; bad props for a
// known type fail; valid props pass through with .data populated.
export const renderableComponentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('AskAgain'), props: askAgainSchema }),
  z.object({
    type: z.literal('AvailabilityChip'),
    props: availabilityChipSchema,
  }),
  z.object({ type: z.literal('BookCallSlot'), props: bookCallSlotSchema }),
  z.object({ type: z.literal('EssayLink'), props: essayLinkSchema }),
  z.object({ type: z.literal('HiringStatus'), props: hiringStatusSchema }),
  z.object({ type: z.literal('LocationCard'), props: locationCardSchema }),
  z.object({ type: z.literal('MetricCard'), props: metricCardSchema }),
  z.object({ type: z.literal('ProjectMini'), props: projectMiniSchema }),
  z.object({ type: z.literal('QuoteBlock'), props: quoteBlockSchema }),
  z.object({ type: z.literal('RateCard'), props: rateCardSchema }),
  z.object({ type: z.literal('StackList'), props: stackListSchema }),
  z.object({ type: z.literal('TimelineSlice'), props: timelineSliceSchema }),
]);

type ValidatedRenderableComponent = z.infer<typeof renderableComponentSchema>;
