import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('knowledgebase RAG integration contract', () => {
  it('keeps profile memory routes on the shared knowledgebase client', () => {
    const routes = [
      'src/app/api/settings/ai-key/route.ts',
      'src/app/api/pages/[pageId]/info/route.ts',
      'src/app/api/pages/[pageId]/info/[blockId]/route.ts',
      'src/app/api/chat/[slug]/route.ts',
    ];

    for (const route of routes) {
      const source = read(route);
      assert.match(source, /@\/lib\/knowledgebase/);
      assert.doesNotMatch(source, /@\/lib\/saasmaker|saasmaker/i);
    }
  });

  it('does not keep the legacy SaasMaker RAG helper', () => {
    assert.equal(existsSync(join(root, 'src/lib/saasmaker.ts')), false);
    const client = read('src/lib/knowledgebase.ts');
    assert.match(client, /RAG_SERVICE/);
    assert.match(client, /knowledgebase/);
    assert.match(client, /filter/);
    assert.doesNotMatch(client, /SAASMAKER_API_URL|SAASMAKER_ADMIN_KEY/);
  });

  it('scopes indexed profile memory by account and page', () => {
    const infoRoute = read('src/app/api/pages/[pageId]/info/route.ts');
    assert.match(infoRoute, /userId:\s*auth\.userId/);
    assert.match(infoRoute, /pageId:\s*page\.id/);
    assert.match(infoRoute, /pageSlug:\s*page\.slug/);

    const chatRoute = read('src/app/api/chat/[slug]/route.ts');
    assert.match(chatRoute, /search\(user\.smIndexId,\s*query,\s*5,\s*\{\s*userId:\s*page\.userId,\s*pageId:\s*page\.id\s*\}/);
  });
});
