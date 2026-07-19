// Privacy contract test for Karte activation events.
//
// The fleet 4-event taxonomy (`signup`, `activated`, `core_action`,
// `returned`) is the only channel through which Karte may report
// activation evidence to PostHog / Foundry. Profile fields, link content,
// chat/contact bodies, AI mode generations, and credentials must never
// enter those events.
//
// This is a source-level contract test: it reads the analytics module and
// every activation call site as text and asserts that:
//   1. The `AnalyticsEventMap` only declares `project_id` (and `action` for
//      `core_action`) — no payload fields for profile/chat/contact/mode.
//   2. Every `trackActivated` / `trackCoreAction` call site passes only the
//      allowed action enum (no private variables).
//   3. No profile/chat/contact variable is passed into `trackEvent`.
//
// A future regression that adds `trackCoreAction('page_published', profile)`
// or extends the event map with a `profile` field will fail this test.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const ACTIVATION_FILES = [
  'src/components/dashboard/page-settings.tsx',
  'src/components/dashboard/page-toggles.tsx',
  'src/components/dashboard/encyclopedia-editor.tsx',
];

async function read(relativePath) {
  return readFile(resolve(ROOT, relativePath), 'utf8');
}

describe('analytics event map only declares sanitized fields', () => {
  it('AnalyticsEventMap carries only project_id (and action for core_action)', async () => {
    const analytics = await read('src/lib/analytics-events.ts');
    expect(analytics).toMatch(/interface AnalyticsEventMap/);
    expect(analytics).toMatch(
      /signup:\s*\{\s*project_id:\s*typeof PROJECT\s*\}/,
    );
    expect(analytics).toMatch(
      /activated:\s*\{\s*project_id:\s*typeof PROJECT\s*\}/,
    );
    expect(analytics).toMatch(
      /core_action:\s*\{\s*project_id:\s*typeof PROJECT;\s*action:\s*CoreAction\s*\}/,
    );
    expect(analytics).toMatch(
      /returned:\s*\{\s*project_id:\s*typeof PROJECT\s*\}/,
    );
    // Extract the AnalyticsEventMap block and assert no payload fields.
    const mapBlock =
      analytics.match(/interface AnalyticsEventMap\s*\{([\s\S]*?)\}/)?.[1] ??
      '';
    expect(mapBlock).toBeTruthy();
    for (const field of [
      'profile',
      'links',
      'chat',
      'contact',
      'email',
      'phone',
      'mode',
      'content',
      'message',
      'body',
    ]) {
      expect(mapBlock).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('CoreAction enum is closed to the two product verbs', async () => {
    const analytics = await read('src/lib/analytics-events.ts');
    expect(analytics).toMatch(
      /export type CoreAction = 'page_published' \| 'mode_generated'/,
    );
  });
});

describe('activation call sites pass only sanitized arguments', () => {
  it.each(
    ACTIVATION_FILES,
  )('%s calls trackActivated/trackCoreAction without private payloads', async (file) => {
    const source = await read(file);
    const coreActionCalls = source.match(/trackCoreAction\([^)]*\)/g) ?? [];
    expect(coreActionCalls.length).toBeGreaterThan(0);
    for (const call of coreActionCalls) {
      // Only the action enum is allowed — no second argument.
      expect(call).toMatch(/^trackCoreAction\(['"][a-z_]+['"]\)$/);
    }
    const activatedCalls = source.match(/trackActivated\([^)]*\)/g) ?? [];
    for (const call of activatedCalls) {
      // trackActivated takes no arguments.
      expect(call).toMatch(/^trackActivated\(\)$/);
    }
  });
});

describe('trackEvent signature does not accept raw private payloads', () => {
  it('trackEvent accepts event + properties only', async () => {
    const analytics = await read('src/lib/analytics-events.ts');
    expect(analytics).toMatch(
      /export function trackEvent\(\s*event:\s*string,\s*properties:\s*Record<string,\s*unknown>\s*=\s*\{\},?\s*\):\s*void/,
    );
  });
});
