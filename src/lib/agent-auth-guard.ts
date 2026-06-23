import 'server-only';

import { and, count, eq, gt } from 'drizzle-orm';

import { db } from '@/db';
import { agentAuthSendLog, apiKeys, user } from '@/db/schema';

import { hashSecret } from './agent-crypto';
import { rateLimit } from './rate-limit';

// Workers Paid includes 3,000 outbound emails/month. Keep agent-auth well under
// that so other transactional mail still fits the quota.
export const AGENT_AUTH_DAILY_EMAIL_CAP = Number(
  process.env.AGENT_AUTH_DAILY_EMAIL_CAP ?? '80',
);

export const AGENT_AUTH_LIMITS = {
  ipPerHour: 5,
  emailPerHour: 2,
  emailCooldownMs: 60_000,
  verifyAttemptsPerCode: 5,
  apiKeysPerEmailPerDay: 5,
} as const;

export async function hashClientIp(ip: string): Promise<string> {
  return hashSecret(`agent-auth-ip:${ip}`);
}

export function checkAgentAuthRateLimits(ip: string, email: string) {
  const ipLimit = rateLimit(`agent-auth:ip:${ip}`, {
    maxRequests: AGENT_AUTH_LIMITS.ipPerHour,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) {
    return {
      ok: false as const,
      status: 429,
      retryAfter: 3600,
      error: 'Too many requests',
    };
  }

  const emailLimit = rateLimit(`agent-auth:email:${email}`, {
    maxRequests: AGENT_AUTH_LIMITS.emailPerHour,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailLimit.ok) {
    return {
      ok: false as const,
      status: 429,
      retryAfter: 3600,
      error: 'Too many code requests for this email',
    };
  }

  return { ok: true as const };
}

export async function assertAgentAuthDailyBudget(): Promise<
  { ok: true } | { ok: false; status: 503; retryAfter: number; error: string }
> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ total: count() })
    .from(agentAuthSendLog)
    .where(gt(agentAuthSendLog.createdAt, since));

  if ((row?.total ?? 0) >= AGENT_AUTH_DAILY_EMAIL_CAP) {
    return {
      ok: false,
      status: 503,
      retryAfter: 3600,
      error: 'Agent sign-in email quota reached. Try again later.',
    };
  }

  return { ok: true };
}

export async function assertAgentAuthEmailCooldown(
  email: string,
): Promise<
  { ok: true } | { ok: false; status: 429; retryAfter: number; error: string }
> {
  const since = new Date(Date.now() - AGENT_AUTH_LIMITS.emailCooldownMs);
  const [row] = await db
    .select({ total: count() })
    .from(agentAuthSendLog)
    .where(
      and(
        eq(agentAuthSendLog.email, email),
        gt(agentAuthSendLog.createdAt, since),
      ),
    );

  if ((row?.total ?? 0) > 0) {
    return {
      ok: false,
      status: 429,
      retryAfter: 60,
      error: 'Please wait before requesting another code.',
    };
  }

  return { ok: true };
}

export async function recordAgentAuthSend(email: string, ipHash: string) {
  await db.insert(agentAuthSendLog).values({
    id: crypto.randomUUID(),
    email,
    ipHash,
    createdAt: new Date(),
  });
}

export async function assertAgentAuthKeyBudget(
  email: string,
): Promise<
  { ok: true } | { ok: false; status: 429; retryAfter: number; error: string }
> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const operator = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (!operator) return { ok: true };

  const [row] = await db
    .select({ total: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, operator.id), gt(apiKeys.createdAt, since)));

  if ((row?.total ?? 0) >= AGENT_AUTH_LIMITS.apiKeysPerEmailPerDay) {
    return {
      ok: false,
      status: 429,
      retryAfter: 3600,
      error: 'Daily API key limit reached for this operator email.',
    };
  }

  return { ok: true };
}
