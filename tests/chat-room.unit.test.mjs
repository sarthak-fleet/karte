import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildRoomShareUrl } from '../src/lib/chat-room.ts';

describe('buildRoomShareUrl', () => {
  it('builds a relative invite path without window', () => {
    assert.equal(
      buildRoomShareUrl('alice', 'room-123'),
      '/alice?room=room-123',
    );
  });
});
