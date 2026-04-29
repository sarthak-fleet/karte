import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

function getD1() {
  const { env } = getCloudflareContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB;
}

export function createAuth() {
  if (_auth) return _auth as ReturnType<typeof betterAuth>;
  const db = getD1();
  const authDb = drizzle(db);
  _auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(authDb, { provider: 'sqlite' }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
    rateLimit: {
      enabled: false,
    },
  });
  return _auth as ReturnType<typeof betterAuth>;
}

/** Execute raw SQL on the auth D1 database */
export async function authDbExecute(sql: string, args: unknown[] = []) {
  const db = getD1();
  return db.prepare(sql).bind(...args).run();
}

// Keep backward compat — lazily resolve `auth`
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    return (createAuth() as Record<string | symbol, unknown>)[prop];
  },
});
