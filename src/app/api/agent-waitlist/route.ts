// Captures emails from card IV of the landing page until the agent
// subtype ships. Honest-stack: just an email and a source tag.

import { NextResponse } from 'next/server';

import { db } from '@/db';
import { agentWaitlist } from '@/db/schema';
import { rateLimit } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254; // RFC 5321

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok } = rateLimit(`agent-waitlist:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!ok) {
    return NextResponse.json(
      { error: 'Slow down — try again in a minute.' },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    source?: unknown;
  };
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source =
    typeof body.source === 'string'
      ? body.source.slice(0, 64)
      : 'landing-card-iv';

  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'That doesn’t look like an email.' },
      { status: 400 },
    );
  }

  try {
    // INSERT OR IGNORE on email — idempotent re-signup, no leakage of
    // whether the email was already there.
    await db
      .insert(agentWaitlist)
      .values({ email, source })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Could not save right now. Try again in a minute.' },
      { status: 502 },
    );
  }
}
