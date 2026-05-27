import { getCloudflareContext } from '@opennextjs/cloudflare';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';

import { account, session, user, verification } from '@/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;
let authTablesReady: Promise<void> | null = null;

function getD1() {
  const { env } = getCloudflareContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB;
}

export function createAuth() {
  if (_auth) return _auth as ReturnType<typeof betterAuth>;
  const db = getD1();
  const authSchema = { user, session, account, verification };
  const authDb = drizzle(db, { schema: authSchema });
  const baseURL =
    process.env.BETTER_AUTH_URL
    || process.env.AUTH_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || 'http://localhost:3000';

  _auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    baseURL,
    database: drizzleAdapter(authDb, {
      provider: 'sqlite',
      schema: authSchema,
    }),
    socialProviders: {
      google: {
        clientId: (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID)!,
        clientSecret: (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET)!,
      },
    },
    trustedOrigins: [baseURL],
    rateLimit: {
      enabled: false,
    },
  });
  return _auth as ReturnType<typeof betterAuth>;
}

export async function ensureAuthTables() {
  if (!authTablesReady) {
    authTablesReady = (async () => {
      const db = getD1();
      const statements = [
        `CREATE TABLE IF NOT EXISTS "user" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "emailVerified" INTEGER NOT NULL DEFAULT 0,
          "image" TEXT,
          "smProjectId" TEXT,
          "smApiKey" TEXT,
          "smIndexId" TEXT,
          "aiEndpointUrl" TEXT,
          "aiApiKey" TEXT,
          "aiModel" TEXT,
          "createdAt" INTEGER NOT NULL,
          "updatedAt" INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS "session" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "expiresAt" INTEGER NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "createdAt" INTEGER NOT NULL,
          "updatedAt" INTEGER NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS "account" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "accountId" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "idToken" TEXT,
          "accessTokenExpiresAt" INTEGER,
          "refreshTokenExpiresAt" INTEGER,
          "scope" TEXT,
          "password" TEXT,
          "createdAt" INTEGER NOT NULL,
          "updatedAt" INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS "verification" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "identifier" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "expiresAt" INTEGER NOT NULL,
          "createdAt" INTEGER,
          "updatedAt" INTEGER
        )`,
      ];

      // Single D1 batch call instead of N sequential prepares — saves
      // ~3 round-trips on Worker cold start.
      await db.batch(statements.map((sql) => db.prepare(sql)));
    })().catch((error) => {
      authTablesReady = null;
      throw error;
    });
  }

  await authTablesReady;
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
