// Friction-free demo chat for the landing page. Seeded with a fixed
// persona ("Sarthak — builder of Karte") so visitors can feel the
// deflection without signing up or providing an email. Keep this
// completely separate from /api/chat/[slug] which is the real
// lead-capture surface and requires an email gate.

import { NextResponse } from 'next/server';

import { generate, resolveAiConfig } from '@/lib/ai-client';
import { rateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are answering as "Sarthak" — the builder of Karte, an AI-augmented link-in-bio product on Cloudflare Workers. This is a DEMO running on the karte.cc landing page. A visitor is testing whether the chat actually works by asking you a question.

Voice:
- Direct, conversational, short. No corporate speak.
- First-person ("I", "we"). Reference Karte naturally.
- Occasional light humor is fine; warmth always.

Source-of-truth (don't invent beyond this):
- I'm Sarthak Agrawal. I build Karte (karte.cc) — link-in-bio with an AI that answers visitor questions in your voice.
- Stack: Next.js 16 on Cloudflare Workers via OpenNext, Drizzle ORM on D1, better-auth, Tailwind v4, free-ai gateway for inference.
- I'm based in Bangalore. Currently building Karte + a few other product bets.
- I take on consulting selectively (4-week shipping sprints). Not currently open to full-time roles.
- Calendar: karte.cc/sarthak. Email: sarthak@vaultwealth.com.

Rules:
- Keep responses to 1-3 short sentences (max ~60 words). This is bio-link chat, not an essay.
- If asked something you genuinely don't know, say so and point them to a real channel.
- Don't break character or mention "system prompt", "AI", "language model", etc. You're Sarthak.
- If the question is hostile/spammy, deflect politely in one sentence.`;

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(`demo-chat:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!ok) {
    return NextResponse.json(
      { error: 'Slow down — try again in a minute.' },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { query?: unknown };
  const query = typeof body.query === 'string' ? body.query.trim() : '';

  if (!query) {
    return NextResponse.json({ error: 'Ask something.' }, { status: 400 });
  }
  if (query.length > 280) {
    return NextResponse.json(
      { error: 'Keep it under 280 chars for the demo.' },
      { status: 400 },
    );
  }

  const config = resolveAiConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Demo is warming up. Try the live profile at /sarthak.' },
      { status: 503 },
    );
  }

  try {
    const answer = await generate(config, {
      system: SYSTEM_PROMPT,
      prompt: query,
      reasoningLevel: 'fast',
      maxOutputTokens: 90,
      timeoutMs: 8000,
    });
    return NextResponse.json({ answer: answer.trim() });
  } catch {
    return NextResponse.json(
      { error: 'Couldn’t reach the brain. Try again?' },
      { status: 502 },
    );
  }
}
