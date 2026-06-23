#!/usr/bin/env node
/**
 * Pre-deploy checks for agent trust cards.
 * Usage: node scripts/smoke-agent-api.mjs [--base-url https://karte.cc]
 *
 * Optional full auth flow (requires live email + migrations):
 *   KARTE_SMOKE_EMAIL=you@example.com KARTE_SMOKE_CODE=123456 node scripts/smoke-agent-api.mjs
 */

const baseUrl = (() => {
  const idx = process.argv.indexOf('--base-url');
  if (idx !== -1 && process.argv[idx + 1])
    return process.argv[idx + 1].replace(/\/$/, '');
  return (process.env.KARTE_BASE_URL || 'https://karte.cc').replace(/\/$/, '');
})();

const failures = [];

async function check(name, fn) {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`fail ${name}: ${message}`);
    failures.push(name);
  }
}

async function fetchText(path) {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

async function fetchJson(path, init) {
  const res = await fetch(`${baseUrl}${path}`, init);
  const body = await res.text();
  let json;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = body;
  }
  if (!res.ok) {
    throw new Error(
      `${res.status} ${typeof json === 'object' ? JSON.stringify(json) : body}`,
    );
  }
  return json;
}

await check('GET /skill.md', async () => {
  const text = await fetchText('/skill.md');
  if (!text.includes('Skill version:'))
    throw new Error('missing skill version header');
});

await check('GET /llms.txt', async () => {
  const text = await fetchText('/llms.txt');
  if (!text.includes('/skill.md')) throw new Error('missing skill link');
});

await check('GET /.well-known/skills/index.json', async () => {
  const json = await fetchJson('/.well-known/skills/index.json');
  if (!Array.isArray(json.skills) || json.skills.length === 0) {
    throw new Error('empty skills index');
  }
});

await check('GET /skills/karte/install.sh', async () => {
  const text = await fetchText('/skills/karte/install.sh');
  if (!text.includes('skill.md'))
    throw new Error('install script missing skill fetch');
});

await check('GET /atlas-demo/agent.json or 404 before seed', async () => {
  const res = await fetch(`${baseUrl}/atlas-demo/agent.json`);
  if (res.status !== 200 && res.status !== 404) {
    throw new Error(`unexpected status ${res.status}`);
  }
});

const smokeEmail = process.env.KARTE_SMOKE_EMAIL;
const smokeCode = process.env.KARTE_SMOKE_CODE;

if (smokeEmail && smokeCode) {
  await check('POST /api/auth/agent/verify-code', async () => {
    const json = await fetchJson('/api/auth/agent/verify-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        code: smokeCode,
        keyName: 'smoke',
      }),
    });
    if (!json.apiKey || !String(json.apiKey).startsWith('kk_')) {
      throw new Error('missing kk_ apiKey');
    }
    process.env.KARTE_SMOKE_API_KEY = json.apiKey;
  });

  if (process.env.KARTE_SMOKE_API_KEY) {
    await check('GET /api/v1/agents', async () => {
      const res = await fetch(`${baseUrl}/api/v1/agents`, {
        headers: { authorization: `Bearer ${process.env.KARTE_SMOKE_API_KEY}` },
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    });
  }
} else {
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed against ${baseUrl}`);
  process.exit(1);
}
