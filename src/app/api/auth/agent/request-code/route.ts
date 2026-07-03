import { and, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { agentAuthCodes } from '@/db/schema';
import {
  assertAgentAuthDailyBudget,
  assertAgentAuthEmailCooldown,
  checkAgentAuthRateLimits,
  hashClientIp,
  recordAgentAuthSend,
} from '@/lib/agent-auth-guard';
import { generateAuthCode, hashSecret } from '@/lib/agent-crypto';
import { sendAgentAuthCode } from '@/lib/agent-email';
import { isValidEmail } from '@/lib/validation';

const CODE_TTL_MS = 10 * 60 * 1000;

function limitResponse(error: string, retryAfter: number, status: number) {
  return NextResponse.json(
    { error, retry_after: retryAfter },
    { status, headers: { 'Retry-After': String(retryAfter) } },
  );
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'A valid email is required' },
      { status: 400 },
    );
  }

  const rateLimits = await checkAgentAuthRateLimits(ip, email);
  if (!rateLimits.ok) {
    return limitResponse(
      rateLimits.error,
      rateLimits.retryAfter,
      rateLimits.status,
    );
  }

  const dailyBudget = await assertAgentAuthDailyBudget();
  if (!dailyBudget.ok) {
    return limitResponse(
      dailyBudget.error,
      dailyBudget.retryAfter,
      dailyBudget.status,
    );
  }

  const cooldown = await assertAgentAuthEmailCooldown(email);
  if (!cooldown.ok) {
    return limitResponse(cooldown.error, cooldown.retryAfter, cooldown.status);
  }

  const code = generateAuthCode();
  const codeHash = await hashSecret(code);
  const ipHash = await hashClientIp(ip);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);
  const codeId = crypto.randomUUID();
  await db.insert(agentAuthCodes).values({
    id: codeId,
    email,
    codeHash,
    expiresAt,
    attempts: 0,
    ipHash,
    createdAt: now,
  });

  try {
    await sendAgentAuthCode(email, code);
  } catch (error) {
    await db.delete(agentAuthCodes).where(eq(agentAuthCodes.id, codeId));
    console.error('[agent-auth] failed to send code email', error);
    return NextResponse.json(
      { error: 'Could not send sign-in email' },
      { status: 502 },
    );
  }

  await recordAgentAuthSend(email, ipHash);
  await db
    .delete(agentAuthCodes)
    .where(and(eq(agentAuthCodes.email, email), ne(agentAuthCodes.id, codeId)));

  return NextResponse.json({
    ok: true,
    expires_in_seconds: CODE_TTL_MS / 1000,
    message:
      'If that email can receive Karte agent mail, a sign-in code was sent.',
  });
}
