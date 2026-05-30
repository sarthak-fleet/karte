// Type definitions for the generative-UI component protocol.
//
// The server's chat response now returns a structured payload of
// `{ text, components? }`. The chat widget reads components[] and
// renders each via the registry in /components/public/ai-components/.
//
// Component data follows a hybrid model: the AI infers props from
// profile memory by default; users may override per-component via
// pageSettings.aiComponentDefaults (see schema.ts PageSettings).

export type AIComponentType =
  | 'AskAgain'
  | 'AvailabilityChip'
  | 'BookCallSlot'
  | 'EssayLink'
  | 'HiringStatus'
  | 'LocationCard'
  | 'MetricCard'
  | 'ProjectMini'
  | 'QuoteBlock'
  | 'RateCard'
  | 'StackList'
  | 'TimelineSlice';

// Per-component prop shapes. Keep these JSON-serializable since the AI
// emits them as part of its response payload.

// Visitor-driven sizing knob. Cards visitors most naturally ask to
// resize (Project, Essay, Timeline, Metric) accept this. 'md' is the
// rendered default when absent.
export type ComponentSize = 'sm' | 'md' | 'lg';

export interface AskAgainProps {
  suggestions: string[]; // 2-4 short follow-up questions
}

export interface AvailabilityChipProps {
  status: 'open' | 'limited' | 'closed';
  label?: string; // e.g. 'Open to fractional roles', 'Booked through Q3'
}

export interface BookCallSlotProps {
  url: string; // calendar link — defaults from page.calendarUrl
  label?: string; // CTA text, default 'Book a call'
  duration?: string; // e.g. '20 min', '30 min'
}

export interface EssayLinkProps {
  title: string;
  url: string;
  excerpt?: string; // first sentence or pull quote
  year?: string;
  size?: ComponentSize;
}

export interface HiringStatusProps {
  status: 'open' | 'fractional-only' | 'advising-only' | 'closed';
  label?: string; // free-form override
}

export interface LocationCardProps {
  city: string;
  timezone?: string;
  travelStatus?: string; // e.g. 'Mostly Lisbon, travels Q2/Q3'
}

export interface MetricCardProps {
  value: string; // e.g. '$420k/mo', '200k DAU'
  label: string; // e.g. 'Combined MRR', 'Peak users'
  context?: string; // e.g. 'Sept 2024', 'Front.Page era'
  size?: ComponentSize;
}

export interface ProjectMiniProps {
  title: string;
  url?: string;
  description?: string;
  imageUrl?: string | null; // SafeImage handles failures
  size?: ComponentSize;
}

export interface QuoteBlockProps {
  quote: string;
  attribution?: string;
}

export interface RateCardProps {
  tier: string; // e.g. '4-week sprint', 'Advising'
  price: string; // e.g. '$18k', '$2k/mo'
  slots?: string; // e.g. 'One slot open in June'
  cta?: string; // CTA text, default 'Book this slot'
  url?: string; // optional booking link
}

export interface StackListProps {
  items: string[]; // tech / tool names — e.g. ['Go', 'Kafka', 'PostgreSQL']
  label?: string; // e.g. 'Backend', 'AI stack'
}

export interface TimelineSliceProps {
  events: Array<{
    when: string;
    title: string;
    where?: string;
  }>;
  heading?: string; // e.g. 'Recent ships'
  size?: ComponentSize;
}

// Top-level layout directives. Scoped to a single AI reply — applied
// when rendering that message's components. The page itself is not
// mutated. See schemas.ts for the runtime validator.
export interface LayoutDirectives {
  density?: 'compact' | 'comfortable' | 'magazine';
  order?: 'recency' | 'impact' | 'alphabetical';
  filter?: string;
  hide?: string[];
  mood?: 'serious' | 'playful' | 'minimal' | 'dark';
}

// Discriminated union the registry consumes.
export type RenderableComponent =
  | { type: 'AskAgain'; props: AskAgainProps }
  | { type: 'AvailabilityChip'; props: AvailabilityChipProps }
  | { type: 'BookCallSlot'; props: BookCallSlotProps }
  | { type: 'EssayLink'; props: EssayLinkProps }
  | { type: 'HiringStatus'; props: HiringStatusProps }
  | { type: 'LocationCard'; props: LocationCardProps }
  | { type: 'MetricCard'; props: MetricCardProps }
  | { type: 'ProjectMini'; props: ProjectMiniProps }
  | { type: 'QuoteBlock'; props: QuoteBlockProps }
  | { type: 'RateCard'; props: RateCardProps }
  | { type: 'StackList'; props: StackListProps }
  | { type: 'TimelineSlice'; props: TimelineSliceProps };

// Server response shape for the chat endpoint. Either text-only
// (legacy / no components needed) or text + components array.
export interface ChatResponse {
  text: string;
  components?: RenderableComponent[];
  // Echoed back so the client can correlate suggestion chips with
  // the originating question (AskAgain follow-ups).
  conversationId?: string;
}
