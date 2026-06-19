// AI paste-in importer for timeline events.
//
// User pastes raw career / project text (e.g. their LinkedIn experience
// section) and we ask free-ai to extract a structured list of events.
// We do NOT save them server-side here — we return the parsed events
// so the dashboard can show a preview, let the user edit/uncheck, and
// then call the regular POST /timeline endpoint to commit the keepers.

import { NextResponse } from 'next/server';

import type { TimelineEventType } from '@/db/schema';
import { generate, resolveAiConfig } from '@/lib/ai-client';
import { TIMELINE_IMPORT_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

const VALID_TYPES: ReadonlySet<TimelineEventType> = new Set([
  'joined-company',
  'shipped-project',
  'launched-product',
  'wrote-essay',
  'spoke-at',
  'shipped-release',
  'moved-to',
  'life-event',
  'agent-deployed',
  'agent-capability-added',
  'agent-ownership-changed',
  'custom',
]);

const MAX_INPUT_CHARS = 12_000;
const MAX_TITLE = 200;
const MAX_BODY = 1500;
const MAX_FIELD = 200;

interface ParsedEvent {
  type: TimelineEventType;
  title: string;
  body: string | null;
  whereLabel: string | null;
  whenLabel: string;
  link: string | null;
}

async function verifyOwnership(pageId: string, userId: string) {
  return loadOwnedPage(pageId, userId);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { pageId } = await params;
  const page = await verifyOwnership(pageId, auth.userId);
  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate-limited per user since AI calls cost money + this is the only
  // place anyone can trigger an AI parse from the dashboard.
  const { ok } = rateLimit(`timeline-import:${auth.userId}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!ok) {
    return NextResponse.json(
      { error: 'Slow down — try again in a minute.' },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { text?: unknown };
  const raw = typeof body.text === 'string' ? body.text.trim() : '';
  if (!raw) {
    return NextResponse.json({ error: 'Paste some text first.' }, { status: 400 });
  }
  if (raw.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Too long — keep it under ${MAX_INPUT_CHARS.toLocaleString()} characters.` },
      { status: 400 },
    );
  }

  const config = resolveAiConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'AI is unavailable right now. Add events manually.' },
      { status: 503 },
    );
  }

  let aiOutput: string;
  try {
    aiOutput = await generate(config, {
      system: TIMELINE_IMPORT_SYSTEM_PROMPT,
      prompt: raw,
      reasoningLevel: 'fast',
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not parse — try again.' },
      { status: 502 },
    );
  }

  const events = extractAndSanitize(aiOutput);
  if (events.length === 0) {
    return NextResponse.json(
      {
        error:
          "Couldn't find any events in that text. Try pasting your LinkedIn experience section or a resume snippet.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ events });
}

function extractAndSanitize(raw: string): ParsedEvent[] {
  // Models occasionally wrap in code fences — pluck the JSON.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const record = parsed as Record<string, unknown>;
  const rawEvents = Array.isArray(record.events) ? record.events : [];

  const out: ParsedEvent[] = [];
  for (const item of rawEvents) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;

    const type = typeof r.type === 'string' ? r.type : '';
    if (!VALID_TYPES.has(type as TimelineEventType)) continue;

    const title = typeof r.title === 'string' ? r.title.trim().slice(0, MAX_TITLE) : '';
    const whenLabel =
      typeof r.whenLabel === 'string' ? r.whenLabel.trim().slice(0, MAX_FIELD) : '';
    if (!title || !whenLabel) continue;

    out.push({
      type: type as TimelineEventType,
      title,
      body:
        typeof r.body === 'string' && r.body.trim()
          ? r.body.trim().slice(0, MAX_BODY)
          : null,
      whereLabel:
        typeof r.whereLabel === 'string' && r.whereLabel.trim()
          ? r.whereLabel.trim().slice(0, MAX_FIELD)
          : null,
      whenLabel,
      link:
        typeof r.link === 'string' && /^https?:\/\//i.test(r.link)
          ? r.link.trim().slice(0, MAX_FIELD)
          : null,
    });
  }

  return out;
}
