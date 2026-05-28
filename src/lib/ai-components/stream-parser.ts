// Streaming parser for the chat response protocol:
//
//   <text...>
//   <<<COMPONENTS>>>
//   [ {type, props}, ... ]
//
// Used by the chat widget to:
//   1. Stream text live to the message bubble.
//   2. Detect the marker even when it arrives split across chunks.
//   3. Buffer the JSON tail, then parse + sanitize on stream end.
//
// Self-contained: no React, no DOM. Pure state machine.

import type { RenderableComponent } from './types';

const MARKER = '<<<COMPONENTS>>>';

const ALLOWED_TYPES: ReadonlySet<RenderableComponent['type']> = new Set([
  'AskAgain', 'AvailabilityChip', 'BookCallSlot', 'EssayLink', 'HiringStatus',
  'LocationCard', 'MetricCard', 'ProjectMini', 'QuoteBlock', 'RateCard',
  'StackList', 'TimelineSlice',
]);

// Default suggestions appended when the AI returned other components
// but forgot AskAgain. Three options that work for almost any profile.
const FALLBACK_ASK_AGAIN: RenderableComponent = {
  type: 'AskAgain',
  props: {
    suggestions: [
      'Tell me more',
      'How do I reach you?',
      "What's next for you?",
    ],
  },
};

export interface StreamParserState {
  // Plain text streamed so far (safe to render to the bubble).
  text: string;
  // Buffered raw text that hasn't been flushed yet because it might
  // contain a partial marker prefix.
  pendingText: string;
  // After the marker, raw JSON characters get buffered here.
  jsonBuffer: string;
  // Once we see the marker, all subsequent chunks go to jsonBuffer.
  inComponents: boolean;
}

export function createStreamParserState(): StreamParserState {
  return { text: '', pendingText: '', jsonBuffer: '', inComponents: false };
}

/**
 * Feed a chunk into the parser. Mutates state. Returns the new flushable
 * text that the caller should append to its visible message bubble.
 *
 * The trick: when not yet in components mode, we keep the last
 * (MARKER.length - 1) characters in pendingText in case they're the
 * start of the marker. Only what's safely past that window flushes.
 */
export function feedChunk(state: StreamParserState, chunk: string): string {
  if (state.inComponents) {
    state.jsonBuffer += chunk;
    return '';
  }

  state.pendingText += chunk;
  const idx = state.pendingText.indexOf(MARKER);
  if (idx >= 0) {
    // Marker found — flush everything before it, then switch modes.
    const flushed = state.pendingText.slice(0, idx);
    state.text += flushed;
    const afterMarker = state.pendingText.slice(idx + MARKER.length);
    state.pendingText = '';
    state.jsonBuffer = afterMarker;
    state.inComponents = true;
    return flushed;
  }

  // No marker yet — flush all but the last (MARKER.length - 1) chars
  // since those might be the start of the marker arriving in pieces.
  const safeEnd = Math.max(0, state.pendingText.length - (MARKER.length - 1));
  const flushed = state.pendingText.slice(0, safeEnd);
  state.text += flushed;
  state.pendingText = state.pendingText.slice(safeEnd);
  return flushed;
}

/**
 * Called when the stream finishes. Flushes any pendingText left
 * over (no marker arrived), parses the JSON buffer, returns
 * sanitized components.
 */
export function finishStream(state: StreamParserState): {
  flushedText: string;
  components: RenderableComponent[];
} {
  let flushedText = '';
  if (!state.inComponents && state.pendingText) {
    // Stream ended before the marker arrived — flush the rest as text.
    flushedText = state.pendingText;
    state.text += flushedText;
    state.pendingText = '';
  }

  const components = parseComponentsBuffer(state.jsonBuffer);
  return { flushedText, components: augmentComponents(components) };
}

function parseComponentsBuffer(raw: string): RenderableComponent[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // The AI may emit the array followed by stray prose or fences.
  // Extract the first balanced [...] array.
  const start = trimmed.indexOf('[');
  if (start === -1) return [];
  let depth = 0;
  let end = -1;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const out: RenderableComponent[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const type = typeof r.type === 'string' ? r.type : '';
    if (!ALLOWED_TYPES.has(type as RenderableComponent['type'])) continue;
    const props =
      r.props && typeof r.props === 'object'
        ? (r.props as Record<string, unknown>)
        : {};
    // Skip half-baked components with no props — they render as blank
    // cards otherwise.
    if (Object.keys(props).length === 0) continue;
    out.push({ type, props } as unknown as RenderableComponent);
  }
  return out;
}

/**
 * If the AI emitted other components but no AskAgain, append a default
 * one so visitors always have a clear follow-up path. Cheap reliability
 * boost on the prompt's "usually include AskAgain" rule.
 */
function augmentComponents(components: RenderableComponent[]): RenderableComponent[] {
  if (components.length === 0) return components;
  const hasAskAgain = components.some((c) => c.type === 'AskAgain');
  if (hasAskAgain) return components;
  return [...components, FALLBACK_ASK_AGAIN];
}
