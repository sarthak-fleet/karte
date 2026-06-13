import { strict as assert } from 'node:assert';
import { test } from 'node:test';

function scoreLead(events) {
  return events.reduce((total, event) => {
    if (event.eventType === 'contact_submit' || event.eventType === 'dm_submit') {
      return total + 12;
    }

    if (event.eventType === 'chat_cta_click' || event.eventType === 'hook_open') {
      return total + 5;
    }

    if (event.eventType === 'outbound_click') {
      return total + 4;
    }

    if (event.eventType === 'section_view') {
      return total + 2;
    }

    return total + 1;
  }, 0);
}

test('dm_submit is scored like other direct lead submissions', () => {
  const dmScore = scoreLead([{ eventType: 'dm_submit' }]);
  const contactScore = scoreLead([{ eventType: 'contact_submit' }]);
  assert.equal(dmScore, contactScore);
  assert.equal(dmScore, 12);
});

