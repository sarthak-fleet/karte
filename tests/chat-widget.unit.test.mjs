import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('chat widget reliability contract', () => {
  it('does not leave a blank assistant bubble when a stream is empty or errors', () => {
    const source = read('src/components/public/chat-widget.tsx');

    assert.match(source, /EMPTY_CHAT_RESPONSE_MESSAGE/);
    assert.match(source, /CHAT_SERVICE_UNAVAILABLE_MESSAGE/);
    assert.match(
      source,
      /last\?\.role === 'assistant' && !last\.content\.trim\(\)/,
    );
    assert.match(
      source,
      /void saveMessage\(convId,\s*'assistant',\s*EMPTY_CHAT_RESPONSE_MESSAGE\)/,
    );
  });
});
