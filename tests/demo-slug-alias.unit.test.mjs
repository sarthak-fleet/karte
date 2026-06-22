import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('demo slug alias contract', () => {
  it('keeps /demo as a supported public alias for a seeded demo profile', () => {
    const source = read('src/lib/demo-profiles.ts');

    assert.match(source, /demo:\s*'naval'/);
    assert.match(source, /function resolvePublicProfileSlug/);
  });

  it('uses public slug resolution for profile page and chat routes', () => {
    for (const file of [
      'src/app/[slug]/page.tsx',
      'src/app/[slug]/_lib/get-page-data.ts',
      'src/app/api/chat/[slug]/route.ts',
      'src/app/api/chat/[slug]/conversations/route.ts',
      'src/app/api/chat/[slug]/messages/route.ts',
    ]) {
      assert.match(read(file), /resolvePublicProfileSlug/);
    }
  });
});
