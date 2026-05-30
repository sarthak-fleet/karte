// Streaming parser for the chat response protocol:
//
//   <text...>
//   <<<COMPONENTS>>>
//   [ {type, props}, ... ]
//   <<<LAYOUT>>>
//   { density?, order?, filter?, hide?, mood? }
//
// Used by the chat widget to:
//   1. Stream text live to the message bubble.
//   2. Detect markers even when they arrive split across chunks.
//   3. Buffer the JSON tail, then parse + validate against Zod schemas
//      on stream end.
//
// The COMPONENTS block is required for any structured tail; the
// LAYOUT block is optional and only meaningful if it follows
// COMPONENTS. Layout directives apply to this reply's components only
// (the page itself is not mutated).
//
// Self-contained: no React, no DOM. Pure state machine.

import { layoutDirectivesSchema, renderableComponentSchema } from './schemas';
import type { LayoutDirectives, RenderableComponent } from './types';

const MARKER = '<<<COMPONENTS>>>';
const LAYOUT_MARKER = '<<<LAYOUT>>>';

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

// We hold back enough trailing text to absorb either marker arriving
// split across chunks. Using the longer of the two keeps both safe.
const SAFE_TAIL = Math.max(MARKER.length, LAYOUT_MARKER.length) - 1;

/**
 * Feed a chunk into the parser. Mutates state. Returns the new flushable
 * text that the caller should append to its visible message bubble.
 *
 * The trick: when not yet in components mode, we keep the last
 * (SAFE_TAIL) characters in pendingText in case they're the start of
 * a marker. Only what's safely past that window flushes.
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

  // No marker yet — flush all but the last SAFE_TAIL chars since
  // those might be the start of a marker arriving in pieces.
  const safeEnd = Math.max(0, state.pendingText.length - SAFE_TAIL);
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
  layout: LayoutDirectives | null;
} {
  let flushedText = '';
  if (!state.inComponents && state.pendingText) {
    // Stream ended before the marker arrived — flush the rest as text.
    flushedText = state.pendingText;
    state.text += flushedText;
    state.pendingText = '';
  }

  const { componentsRaw, layoutRaw } = splitOnLayoutMarker(state.jsonBuffer);
  const components = parseComponentsBuffer(componentsRaw);
  const layout = parseLayoutBuffer(layoutRaw);
  return {
    flushedText,
    components: augmentComponents(components),
    layout,
  };
}

// Split the post-COMPONENTS buffer on the optional <<<LAYOUT>>> marker.
// If it isn't present, the whole buffer is treated as components JSON.
function splitOnLayoutMarker(raw: string): {
  componentsRaw: string;
  layoutRaw: string;
} {
  const idx = raw.indexOf(LAYOUT_MARKER);
  if (idx === -1) return { componentsRaw: raw, layoutRaw: '' };
  return {
    componentsRaw: raw.slice(0, idx),
    layoutRaw: raw.slice(idx + LAYOUT_MARKER.length),
  };
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
    // Zod validates type + per-component prop shape in one shot.
    // Unknown types fail discrimination; bad props for known types
    // fail field-level constraints. Either way: silently skip.
    const parsedResult = renderableComponentSchema.safeParse(item);
    if (!parsedResult.success) continue;
    out.push(parsedResult.data as RenderableComponent);
  }
  return out;
}

// Extract the first balanced {...} object from a buffer and validate
// it against the layout schema. Returns null on any failure — layout
// is an optional augmentation, never a hard requirement.
function parseLayoutBuffer(raw: string): LayoutDirectives | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const start = trimmed.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end));
  } catch {
    return null;
  }
  const result = layoutDirectivesSchema.safeParse(parsed);
  if (!result.success) return null;
  return result.data as LayoutDirectives;
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
