import { toNextJsHandler } from 'better-auth/next-js';

import { createAuth, ensureAuthTables } from '@/lib/auth';

export const GET = async (req: Request) => {
  await ensureAuthTables();
  const { GET: handler } = toNextJsHandler(createAuth().handler);
  return handler?.(req);
};

export const POST = async (req: Request) => {
  await ensureAuthTables();
  const { POST: handler } = toNextJsHandler(createAuth().handler);
  return handler?.(req);
};
