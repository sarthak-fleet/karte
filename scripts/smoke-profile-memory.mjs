#!/usr/bin/env node
/**
 * Smoke Karte profile-memory -> knowledgebase wiring.
 *
 * Public/auth-boundary checks run without credentials. Full product smoke needs
 * a real signed-in browser session cookie:
 *
 *   KARTE_SESSION_COOKIE='better-auth.session_token=...' pnpm smoke:profile-memory
 */

const baseUrl =
  readArg('--base-url') || process.env.KARTE_BASE_URL || 'https://karte.cc';
const cookie = process.env.KARTE_SESSION_COOKIE || '';
const failures = [];

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.replace(/\/+$/, '') : '';
}

function headers(json = true) {
  return {
    ...(json ? { 'content-type': 'application/json' } : {}),
    ...(cookie ? { cookie } : {}),
  };
}

async function request(path, init = {}) {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    ...init,
    headers: {
      ...headers(init.body !== undefined),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body, text };
}

async function check(name, fn) {
  try {
    const _result = await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`fail ${name}: ${message}`);
    failures.push(name);
  }
}

await check('public app responds', async () => {
  const { res, text } = await request('/');
  if (!res.ok) throw new Error(`${res.status}`);
  if (!text.includes('Karte') && !text.includes('Linkchat'))
    throw new Error('landing marker missing');
});

await check('profile-memory endpoints require auth', async () => {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/pages`);
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
});

if (!cookie) {
} else {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  let pageId = '';
  let blockId = '';

  await check('authenticated knowledgebase status', async () => {
    const { res, body } = await request('/api/settings/knowledgebase', {
      headers: headers(false),
    });
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
    return JSON.stringify({ hasIndex: Boolean(body?.hasIndex) });
  });

  await check('ensure profile memory index', async () => {
    const { res, body } = await request('/api/settings/knowledgebase', {
      method: 'POST',
      body: '{}',
    });
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
    if (!body?.hasIndex || !body?.indexId)
      throw new Error('missing index proof');
    return JSON.stringify({ indexId: body.indexId });
  });

  await check('create smoke page', async () => {
    const { res, body } = await request('/api/pages', {
      method: 'POST',
      body: JSON.stringify({
        slug: `kb-smoke-${suffix}`,
        displayName: 'Knowledgebase Smoke',
        bio: 'Temporary smoke page for profile-memory RAG verification.',
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
    if (!body?.id) throw new Error('missing page id');
    pageId = body.id;
    return JSON.stringify({ pageId });
  });

  await check('enable smoke page chat', async () => {
    const { res, body } = await request(
      `/api/pages/${encodeURIComponent(pageId)}/chat-config`,
      {
        method: 'PUT',
        body: JSON.stringify({ chatEnabled: true }),
      },
    );
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  });

  await check('ingest profile memory through app route', async () => {
    const uniqueFact = `profile memory smoke fact ${suffix}`;
    const { res, body } = await request(
      `/api/pages/${encodeURIComponent(pageId)}/info`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'faq',
          title: 'Smoke fact',
          content: `Remember this exact test phrase: ${uniqueFact}.`,
        }),
      },
    );
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
    if (!body?.id) throw new Error('missing block id');
    blockId = body.id;
  });

  await check('memory block has knowledgebase document id', async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { res, body } = await request(
        `/api/pages/${encodeURIComponent(pageId)}/info`,
        {
          headers: headers(false),
        },
      );
      if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
      const block = Array.isArray(body)
        ? body.find((item) => item.id === blockId)
        : null;
      if (block?.smDocumentId)
        return JSON.stringify({ documentId: block.smDocumentId });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('smDocumentId was not persisted');
  });

  await check('delete memory block cleans app record', async () => {
    const { res, body } = await request(
      `/api/pages/${encodeURIComponent(pageId)}/info/${encodeURIComponent(blockId)}`,
      { method: 'DELETE', headers: headers(false) },
    );
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke check(s) failed`);
  process.exit(1);
}
