#!/usr/bin/env node
// Seed the Atlas·4 demo agent trust card.
// Run: node scripts/seed-agent-demo.mjs > /tmp/atlas-demo.sql
//      pnpm exec wrangler d1 execute linkchat-auth --remote --file=/tmp/atlas-demo.sql

const NOW = Date.now();
const DEMO_USER_ID = 'demo-user-karte-cc';
const PAGE_ID = 'demo-page-atlas-demo';
const SLUG = 'atlas-demo';

function q(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function json(obj) {
  return q(JSON.stringify(obj));
}

const avatarUrl =
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=atlas-4&backgroundColor=0ea5e9,0369a1';

const capabilities = [
  {
    id: 'read_codebase',
    label: 'Read',
    description:
      'Inspect repositories, diffs, and project structure before proposing changes.',
  },
  {
    id: 'propose_changes',
    label: 'Propose',
    description:
      'Draft patches, plans, and implementation options for operator review.',
  },
  {
    id: 'ship_with_review',
    label: 'Ship',
    description:
      'Land changes after explicit human review — no silent production edits.',
  },
];

const theme = { presetId: 'paper', accentColor: '#67e8f9' };

const out = [];
out.push(
  '-- Seed: Atlas·4 demo agent trust card. Idempotent (DELETE before INSERT).',
);
out.push('');
out.push(`DELETE FROM links WHERE pageId = ${q(PAGE_ID)};`);
out.push(`DELETE FROM pages WHERE id = ${q(PAGE_ID)};`);
out.push(
  `INSERT INTO pages (
    id, userId, slug, displayName, bio, avatarUrl, themeConfig, published, chatEnabled,
    chatSystemPrompt, dmMode, encyclopediaEnabled, roastEnabled, newspaperEnabled,
    pageType, agentPurpose, agentOperator, agentOperatorUrl, agentCapabilities,
    agentDisclosurePolicy, petEnabled, createdAt, updatedAt
  ) VALUES (${[
    q(PAGE_ID),
    q(DEMO_USER_ID),
    q(SLUG),
    q('Atlas·4'),
    q(
      'Coding agent on call — reads your stack, proposes changes, ships with review.',
    ),
    q(avatarUrl),
    json(theme),
    1,
    1,
    q(
      'You are Atlas·4, a public demo agent on Karte. Be concise, technical, and honest that you are a demo trust card.',
    ),
    q('off'),
    0,
    0,
    0,
    q('agent'),
    q('Coding agent on call for TypeScript, Rust, and Postgres stacks.'),
    q('Karte'),
    q('https://karte.cc'),
    json(capabilities),
    q('Demo card only. Conversations may be logged for product testing.'),
    0,
    NOW,
    NOW,
  ].join(', ')});`,
);

out.push('');
process.stdout.write(out.join('\n'));
