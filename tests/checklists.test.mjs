import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as list from '../src/features/scratch/checklistStore.js';

const item = (id, depth = 0, completed = false, text = id) => ({ id, depth, completed, text });
const sample = () => [
  item('Pack'),
  item('Passport', 1),
  item('Clothes', 1),
  item('Shirts', 2),
  item('Tickets'),
];
const shape = (items) => items.map(({ id, depth }) => [id, depth]);

test('notes and Markdown checkboxes convert to checklists without losing nesting or completion', () => {
  const value = list.checklistFromNote(
    '# Trip\n\n- [ ] Pack\n  - [x] Passport\n  - [ ] **Clothes**\n- Buy [tickets](https://example.com)',
  );
  assert.equal(value.title, 'Trip');
  assert.deepEqual(
    value.items.map(({ text, depth, completed }) => [text, depth, completed]),
    [
      ['Pack', 0, false],
      ['Passport', 1, true],
      ['**Clothes**', 1, false],
      ['Buy [tickets](https://example.com)', 0, false],
    ],
  );
  const restored = list.checklistFromNote(list.checklistMarkdown(value));
  assert.equal(list.checklistMarkdown(restored), list.checklistMarkdown(value));
  assert.equal(list.validChecklist(restored), true);
});

test('completion cascades to children and progress includes every nonempty entry', () => {
  const original = sample();
  const done = list.setChecklistCompleted(original, 'Pack', true);
  assert.deepEqual(list.checklistProgress(done), { done: 4, total: 5, fraction: 0.8 });
  assert.equal(original[0].completed, false);
  const partial = list.setChecklistCompleted(done, 'Shirts', false);
  assert.deepEqual(
    partial.map((row) => row.completed),
    [false, true, false, false, false],
  );
  assert.deepEqual(list.checklistProgress([...partial, item('blank', 0, true, ' ')]), {
    done: 1,
    total: 5,
    fraction: 0.2,
  });
  assert.equal(list.checklistProgress([]).fraction, 0);
});

test('outdenting a branch preserves the old parent’s other children and moves its own subtree', () => {
  const original = sample();
  const result = list.indentChecklistItem(original, 'Clothes', -1);
  assert.deepEqual(shape(result), [
    ['Pack', 0],
    ['Passport', 1],
    ['Clothes', 0],
    ['Shirts', 1],
    ['Tickets', 0],
  ]);
  const middle = list.indentChecklistItem(original, 'Passport', -1);
  assert.deepEqual(shape(middle), [
    ['Pack', 0],
    ['Clothes', 1],
    ['Shirts', 2],
    ['Passport', 0],
    ['Tickets', 0],
  ]);
  assert.deepEqual(shape(original), shape(sample()));
  assert.equal(list.indentChecklistItem(original, 'Pack', 1), original);
});

test('dragging parents moves whole branches, and dragging children to a top-level task promotes them', () => {
  const original = sample();
  assert.deepEqual(shape(list.moveChecklistItem(original, 'Pack', 'Tickets')), [
    ['Tickets', 0],
    ['Pack', 0],
    ['Passport', 1],
    ['Clothes', 1],
    ['Shirts', 2],
  ]);
  assert.deepEqual(shape(list.moveChecklistItem(original, 'Clothes', 'Tickets')), [
    ['Pack', 0],
    ['Passport', 1],
    ['Tickets', 0],
    ['Clothes', 0],
    ['Shirts', 1],
  ]);
  assert.equal(list.moveChecklistItem(original, 'Pack', 'Shirts'), original);
  assert.deepEqual(shape(list.moveChecklistItem(original, 'Passport', 'Passport', -1)), [
    ['Pack', 0],
    ['Clothes', 1],
    ['Shirts', 2],
    ['Passport', 0],
    ['Tickets', 0],
  ]);
});

test('removing an entry or an empty parent promotes its children without deleting their content', () => {
  const original = sample();
  assert.deepEqual(shape(list.removeChecklistItem(original, 'Pack')), [
    ['Passport', 0],
    ['Clothes', 0],
    ['Shirts', 1],
    ['Tickets', 0],
  ]);
  const compact = list.compactChecklistItems(
    original.map((row) => (row.id === 'Pack' ? { ...row, text: ' ' } : row)),
  );
  assert.deepEqual(shape(compact), shape(list.removeChecklistItem(original, 'Pack')));
  assert.equal(list.validChecklist({ title: 'Trip', items: compact }), true);
});

test('checklist validation rejects duplicate IDs, orphaned depths and invalid completion values', () => {
  assert.equal(list.validChecklist({ title: 'Trip', items: sample() }), true);
  for (const items of [
    [item('a', 1)],
    [item('a'), item('b', 2)],
    [item('a'), item('a')],
    [item('a', 0, 'yes')],
    [null],
  ]) {
    assert.equal(list.validChecklist({ title: 'Trip', items }), false);
  }
  assert.equal(list.validChecklist({ title: ' ', items: [] }), true);
  assert.equal(list.validChecklist(null), false);
});

test('untitled checklists export tasks without an empty heading and retain formatting', () => {
  const value = { title: '', items: [item('task', 0, true, '**Done**')] };
  assert.equal(list.validChecklist(value), true);
  assert.equal(list.checklistMarkdown(value), '- [x] **Done**');
  const restored = list.checklistFromNote(list.checklistMarkdown(value));
  assert.equal(restored.title, '');
  assert.equal(restored.items[0].text, '**Done**');
  assert.equal(restored.items[0].completed, true);
  assert.equal(list.validChecklist({ ...value, title: 'x'.repeat(201) }), false);
});

test('repeated branch moves and depth changes preserve every entry and a valid hierarchy', () => {
  let seed = 72;
  const random = (max) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  let items = Array.from({ length: 25 }, (_, index) => item(String(index)));
  const ids = items.map((row) => row.id).sort();
  for (let step = 0; step < 2000; step++) {
    const active = items[random(items.length)].id;
    items =
      step % 3
        ? list.moveChecklistItem(items, active, items[random(items.length)].id, random(3) - 1)
        : list.indentChecklistItem(items, active, random(2) ? 1 : -1);
    assert.equal(
      list.validChecklist({ title: 'Tasks', items }),
      true,
      `invalid hierarchy at move ${step}`,
    );
    assert.deepEqual(items.map((row) => row.id).sort(), ids);
  }
});
