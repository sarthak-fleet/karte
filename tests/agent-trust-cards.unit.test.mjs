import assert from 'node:assert/strict';
import { test } from 'vitest';
import { normalizeAgentCapabilities } from '../src/lib/agent-capabilities.ts';
import {
  generateApiKeyRaw,
  generateAuthCode,
  hashSecret,
  isApiKeyFormat,
} from '../src/lib/agent-crypto.ts';
import {
  buildKarteAgentDiscoveryCard,
  buildKarteAgentSkillMarkdown,
  KARTE_AGENT_SKILL_VERSION,
} from '../src/lib/karte-agent-skill.ts';

test('generateAuthCode returns a 6-digit string', () => {
  const code = generateAuthCode();
  assert.match(code, /^\d{6}$/);
});

test('generateApiKeyRaw uses kk_ prefix', () => {
  const key = generateApiKeyRaw();
  assert.ok(isApiKeyFormat(key));
});

test('hashSecret is deterministic for the same input', async () => {
  const a = await hashSecret('hello');
  const b = await hashSecret('hello');
  assert.equal(a, b);
});

test('normalizeAgentCapabilities accepts valid capability rows', () => {
  const result = normalizeAgentCapabilities([
    {
      id: 'check_inventory',
      description: 'Read inventory levels',
      label: 'Check inventory',
    },
  ]);
  assert.deepEqual(result, [
    {
      id: 'check_inventory',
      description: 'Read inventory levels',
      label: 'Check inventory',
    },
  ]);
});

test('normalizeAgentCapabilities rejects invalid payloads', () => {
  assert.equal(normalizeAgentCapabilities('nope'), null);
  assert.equal(
    normalizeAgentCapabilities([{ id: '', description: 'x' }]),
    null,
  );
});

test('buildKarteAgentSkillMarkdown includes version and auth endpoints', () => {
  const body = buildKarteAgentSkillMarkdown('https://karte.cc');
  assert.match(body, new RegExp(`Skill version: ${KARTE_AGENT_SKILL_VERSION}`));
  assert.match(body, /request-code/);
  assert.match(body, /agent\.json/);
});

test('buildKarteAgentSkillMarkdown documents autonomous AgentMail signup', () => {
  const body = buildKarteAgentSkillMarkdown('https://karte.cc');
  assert.match(body, /AgentMail/);
  assert.match(body, /agent-card\.sh signup/);
  assert.match(body, /api\.agentmail\.to\/v0\/inboxes/);
});

test('buildKarteAgentDiscoveryCard advertises autonomous signup', () => {
  const card = buildKarteAgentDiscoveryCard('https://karte.cc');
  assert.equal(
    card.authentication.autonomous_signup.email_provider,
    'https://agentmail.to',
  );
  assert.match(
    card.authentication.autonomous_signup.command,
    /agent-card\.sh signup/,
  );
});
