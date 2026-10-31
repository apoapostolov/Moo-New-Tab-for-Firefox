import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  QUICKLINK_USAGE_KEY,
  normalizeQuicklinkUsage,
  readQuicklinkUsage,
  rankQuicklinks,
  recordQuicklinkOpen,
  pruneQuicklinkUsage,
} from '../src/features/quicklinks/quicklinkUsage.js';

class Storage {
  getItem(key) {
    return Object.hasOwn(this, key) ? this[key] : null;
  }
  setItem(key, value) {
    this[key] = String(value);
  }
  removeItem(key) {
    delete this[key];
  }
}
globalThis.localStorage = new Storage();
const DAY = 86400000,
  now = Date.parse('2026-10-30T12:00:00Z'),
  today = Math.floor(now / DAY);
const items = [
  { key: 'a', name: 'A', url: 'https://a.example/' },
  { key: 'b', name: 'B', url: 'https://b.example/' },
  { key: 'c', name: 'C', url: 'https://c.example/' },
];
const order = (usage, list = 'quicklinks', links = items) =>
  rankQuicklinks(links, usage, list).map((item) => item.key);
beforeEach(() => {
  globalThis.localStorage = new Storage();
  localStorage.setItem('quicklinks', JSON.stringify(items));
});

test('frequency tracking is off by default and never rewrites manual link order', () => {
  assert.equal(recordQuicklinkOpen(items[1], 'quicklinks', now), null);
  assert.equal(localStorage.getItem(QUICKLINK_USAGE_KEY), null);
  const original = localStorage.getItem('quicklinks');
  localStorage.setItem('quicklinksOrderByFrequency', 'true');
  recordQuicklinkOpen(items[1], 'quicklinks', now);
  recordQuicklinkOpen(items[1], 'quicklinks', now);
  recordQuicklinkOpen(items[2], 'quicklinks', now);
  assert.deepEqual(order(readQuicklinkUsage(now)), ['b', 'c', 'a']);
  assert.equal(localStorage.getItem('quicklinks'), original);
  localStorage.setItem('quicklinksOrderByFrequency', 'false');
  assert.equal(recordQuicklinkOpen(items[0], 'quicklinks', now), null);
  assert.deepEqual(order(readQuicklinkUsage(now)), ['b', 'c', 'a']);
});
test('the 30-day window expires old activity and resolves ties using the saved order', () => {
  const usage = normalizeQuicklinkUsage(
    {
      version: 1,
      entries: [
        {
          list: 'quicklinks',
          ...items[0],
          days: [
            [today - 30, 100],
            [today - 29, 2],
          ],
        },
        { list: 'quicklinks', ...items[1], days: [[today, 3]] },
        { list: 'quicklinks', ...items[2], days: [[today, 2]] },
      ],
    },
    now,
  );
  assert.deepEqual(order(usage), ['b', 'a', 'c']);
  assert.deepEqual(usage.entries[0].days, [[today - 29, 2]]);
  assert.deepEqual(order(normalizeQuicklinkUsage(usage, now + DAY)), ['b', 'c', 'a']);
  assert.deepEqual(order(normalizeQuicklinkUsage(usage, now + 30 * DAY)), ['a', 'b', 'c']);
  assert.deepEqual(
    items.map((x) => x.key),
    ['a', 'b', 'c'],
  );
});
test('Focus/Work counts stay separate even when links have the same key and URL', () => {
  localStorage.setItem('quicklinksOrderByFrequency', 'true');
  localStorage.setItem('focusQuicklinks', JSON.stringify(items));
  recordQuicklinkOpen(items[1], 'quicklinks', now);
  recordQuicklinkOpen(items[2], 'focusQuicklinks', now);
  assert.deepEqual(order(readQuicklinkUsage(now)), ['b', 'a', 'c']);
  assert.deepEqual(order(readQuicklinkUsage(now), 'focusQuicklinks'), ['c', 'a', 'b']);
});
test('changing a destination, deleting a link or using a stale card cannot retain its old score', () => {
  localStorage.setItem('quicklinksOrderByFrequency', 'true');
  recordQuicklinkOpen(items[1], 'quicklinks', now);
  const changed = [items[0], { ...items[1], url: 'https://new.example/' }, items[2]];
  localStorage.setItem('quicklinks', JSON.stringify(changed));
  assert.equal(recordQuicklinkOpen(items[1], 'quicklinks', now), null);
  assert.deepEqual(order(pruneQuicklinkUsage(now), 'quicklinks', changed), ['a', 'b', 'c']);
  assert.equal(localStorage.getItem(QUICKLINK_USAGE_KEY), null);
});
test('damaged, future, fractional and expired counts cannot change ranking', () => {
  localStorage.setItem(QUICKLINK_USAGE_KEY, 'broken');
  assert.deepEqual(readQuicklinkUsage(now), { version: 1, entries: [] });
  const usage = normalizeQuicklinkUsage(
    {
      version: 1,
      entries: [
        null,
        { list: 'other', ...items[1], days: [[today, 99]] },
        {
          list: 'quicklinks',
          ...items[1],
          days: [null, [today, -1], [today, 1.5], [today + 1, 99], [today - 30, 99], [today, 2]],
        },
      ],
    },
    now,
  );
  assert.deepEqual(usage.entries[0].days, [[today, 2]]);
  assert.deepEqual(order(usage), ['b', 'a', 'c']);
});
test('storage failures cannot throw from a link activation', () => {
  localStorage.setItem('quicklinksOrderByFrequency', 'true');
  localStorage.setItem = () => {
    throw Error('Full storage');
  };
  assert.doesNotThrow(() => recordQuicklinkOpen(items[0], 'quicklinks', now));
  assert.equal(recordQuicklinkOpen(items[0], 'quicklinks', now), null);
});
