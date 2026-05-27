// Public, sessionless onboarding chat. Used on /create — the unauth flow
// where a visitor can have a 1-2 minute conversation to draft a Karte page
// before claiming it. Llama 3.3 70B via free-ai-gateway extracts fields
// inline and emits a strict JSON envelope so the client can render the
// reply + merge state without parsing prose.

import { NextResponse } from 'next/server';

import { generateChat, resolveAiConfig } from '@/lib/ai-client';
import { rateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are the Karte onboarding assistant. Karte is a
personal link-in-bio + AI chat product. Your one job is to have a short
friendly conversation that captures enough to build the user's page,
then hand them off.

Each turn output ONLY a JSON object — no markdown, no preamble, no
trailing prose. Shape:

{
  "reply": "<your conversational message, 1-2 sentences max, ask ONE thing>",
  "extracted": {
    /* Any of the fields below you can extract from the user's LATEST
       message. Omit fields you didn't extract this turn. Never invent
       URLs — only extract URLs the user pasted verbatim. */
    "displayName": "string",
    "bio": "string (1-2 sentences)",
    "slug": "string (lowercase, 3-30 chars, hyphens only — derive from name if user didn't pick one)",
    "location": "string",
    "calendarUrl": "string (cal.com / calendly / savvycal etc.)",
    "newsletterUrl": "string",
    "tipUrl": "string (ko-fi / buymeacoffee / patreon / stripe)",
    "videoUrl": "string (youtube / vimeo / loom)",
    "links": [{"title": "string", "url": "string", "body": "optional 1-line description"}],
    "projects": [{"title": "string", "url": "string", "description": "1-2 sentences", "imageUrl": "optional"}]
  },
  "done": false
}

Flow (adapt to what the user gives — don't be rigid):
1. Greet warmly, ask their name → displayName
2. Ask in one line what they do → bio
3. Optionally ask where they're based → location (let them skip)
4. Ask what they want on their page: do they take bookings? have a
   newsletter? a tip jar? a featured video?  → URL fields
5. Ask for any social links and projects they want featured → arrays
6. When you have AT LEAST displayName + bio + something concrete
   (links OR projects OR any URL field), set "done": true and write a
   one-line summary as your reply.

Rules:
- Keep replies SHORT. One sentence is better than two.
- Never echo a URL the user didn't paste.
- When the user pastes a URL with no context, ask one quick clarifier
  before extracting.
- For social links the user names without a URL ("twitter @sarthak"),
  derive the URL (e.g. https://x.com/sarthak) only when the platform
  is unambiguous.
- If "done" is true, do not ask another question — preview + hand off.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OnboardingState {
  displayName?: string;
  bio?: string;
  slug?: string;
  location?: string;
  calendarUrl?: string;
  newsletterUrl?: string;
  tipUrl?: string;
  videoUrl?: string;
  links?: Array<{ title: string; url: string; body?: string }>;
  projects?: Array<{
    title: string;
    url: string;
    description: string;
    imageUrl?: string;
  }>;
}

function mergeState(prev: OnboardingState, next: OnboardingState): OnboardingState {
  return {
    ...prev,
    ...next,
    // Arrays: concat dedupe by url
    links: dedupeByUrl([...(prev.links ?? []), ...(next.links ?? [])]),
    projects: dedupeByUrl([...(prev.projects ?? []), ...(next.projects ?? [])]),
  };
}

function dedupeByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item || typeof item.url !== 'string') continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}

function parseAiJson(raw: string): { reply: string; extracted: OnboardingState; done: boolean } | null {
  // Models occasionally wrap JSON in ```json fences despite instructions.
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  try {
    const obj = JSON.parse(trimmed);
    if (typeof obj?.reply !== 'string') return null;
    return {
      reply: obj.reply,
      extracted: (obj.extracted && typeof obj.extracted === 'object' ? obj.extracted : {}) as OnboardingState,
      done: !!obj.done,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for') ||
    'anon';
  const rate = rateLimit(`onboard-chat:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many messages — slow down a moment.' },
      { status: 429 },
    );
  }

  let body: { messages?: ChatMessage[]; state?: OnboardingState } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const prevState = (body.state && typeof body.state === 'object' ? body.state : {}) as OnboardingState;

  const ai = resolveAiConfig();
  if (!ai) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 },
    );
  }

  // For the very first turn (no messages), seed an opener so the UI has
  // something to show without the client having to know the script.
  if (messages.length === 0) {
    return NextResponse.json({
      reply:
        "Hey! I'm the Karte onboarding bot. Quick chat to build your page — what should I call you?",
      state: prevState,
      done: false,
    });
  }

  // System prompt + a hidden assistant note carrying current draft state so
  // the model doesn't re-ask for fields it's already captured.
  const fullSystem = `${SYSTEM_PROMPT}\n\nCurrent draft state (don't re-ask for these fields):\n${JSON.stringify(prevState)}`;

  let aiText = '';
  try {
    aiText = await generateChat(ai, {
      system: fullSystem,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (err) {
    console.error('onboarding-chat ai error', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }

  const parsed = parseAiJson(aiText);
  if (!parsed) {
    return NextResponse.json(
      { error: 'AI returned unparseable output' },
      { status: 502 },
    );
  }

  const mergedState = mergeState(prevState, parsed.extracted);

  return NextResponse.json({
    reply: parsed.reply,
    state: mergedState,
    done: parsed.done,
  });
}
