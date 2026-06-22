import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('AI client free-ai contract', () => {
  it('sends free-ai project routing explicitly', () => {
    const source = read('src/lib/ai-client.ts');

    assert.match(source, /FREE_AI_PROJECT_ID\s*=\s*'linkchat'/);
    assert.match(source, /DEFAULT_FAST_AI_MODEL\s*=\s*'workers-ai-llama-3b'/);
    assert.match(source, /LINKCHAT_FAST_AI_MODEL/);
    assert.match(source, /'x-gateway-project-id':\s*FREE_AI_PROJECT_ID/);
    assert.match(source, /project_id:\s*FREE_AI_PROJECT_ID/);
  });

  it('maps UX reasoning levels to free-ai reasoning effort', () => {
    const source = read('src/lib/ai-client.ts');

    assert.match(source, /level === 'fast'.*return 'low'/s);
    assert.match(source, /level === 'deep'.*return 'high'/s);
    assert.doesNotMatch(source, /reasoning_level/);
  });
});
