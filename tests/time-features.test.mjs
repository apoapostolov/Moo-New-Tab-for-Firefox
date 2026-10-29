import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'fake-indexeddb/auto';
import { deferScratchGesture } from '../src/utils/pageGestures.js';
import { stackingOrder } from '../src/features/scratch/shared.js';

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
  clear() {
    for (const key of Object.keys(this)) delete this[key];
  }
}
globalThis.localStorage = new Storage();
globalThis.document = new EventTarget();
const server = await createServer({
  server: { middlewareMode: true, hmr: false, open: false },
  logLevel: 'silent',
});
const countdown = await server.ssrLoadModule('/src/features/countdown/countdownStore.js');
const focus = await server.ssrLoadModule('/src/features/focus/focusStore.js');
const fallback = await server.ssrLoadModule('/src/features/background/fallback.js');
const world = await server.ssrLoadModule('/src/features/time/worldClockStore.js');
const backup = await server.ssrLoadModule('/src/utils/settings/backupSchema.js');
const portfolio = await server.ssrLoadModule('/src/features/portfolio/portfolioStore.js');
const checklists = await server.ssrLoadModule('/src/features/scratch/checklistStore.js');
const noteTypes = await server.ssrLoadModule('/src/features/scratch/noteTypes.js');
const numbers = await server.ssrLoadModule('/src/utils/formatNumber.js');
const imageAssets = await server.ssrLoadModule('/src/utils/customBackgroundDB.js');
const translations = await server.ssrLoadModule('/src/lib/translations.js');
await translations.selectLanguage('en_GB');
after(() => server.close());
beforeEach(() => localStorage.clear());

const spec = { title: 'Trip', target: '2026-11-05T12:00:00.000Z', interval: 300, format: 'human' };

test('older Countdown settings links resolve to Floats and preserve sub-sections', async () => {
  const { parseDeepLink, createDeepLink } = await server.ssrLoadModule('/src/utils/deepLinking.js');
  assert.equal(parseDeepLink('#settings/countdown').section, 'floats');
  const legacy = parseDeepLink('#settings/countdown/style');
  assert.equal(legacy.section, 'floats');
  assert.equal(legacy.subSection, 'style');
  assert.equal(parseDeepLink(createDeepLink('settings', { section: 'floats' })).section, 'floats');
  assert.equal(parseDeepLink('#settings/misc').section, 'misc');
});

test('checklist titles and tasks render safe Markdown inside their edit buttons', async () => {
  const { ChecklistMarkdown, checklistLabel } = await server.ssrLoadModule(
    '/src/features/scratch/Markdown.jsx',
  );
  assert.equal(checklistLabel('# **Trip** with _friends_'), 'Trip with friends');
  assert.equal(
    checklistLabel('~~Old~~ **new** *emphasis* and `code`'),
    'Old new emphasis and code',
  );
  const render = (text) =>
    renderToStaticMarkup(
      React.createElement('button', null, React.createElement(ChecklistMarkdown, { text })),
    );
  const title = render('# **Trip** with _friends_');
  assert.ok(title.includes('<strong>Trip</strong>'));
  assert.ok(title.includes('<em>friends</em>'));
  assert.ok(title.includes('scratchChecklistMarkdownHeading'));
  assert.ok(title.includes('data-level="1"'));
  const task = render('~~Old~~ **new** *emphasis* and `code`');
  assert.ok(task.includes('<del>Old</del>'));
  assert.ok(task.includes('<strong>new</strong>'));
  assert.ok(task.includes('<em>emphasis</em>'));
  assert.ok(task.includes('<code>code</code>'));
  assert.ok(render('> **Quoted** task').includes('scratchChecklistMarkdownQuote'));
  const untrusted = render(
    '[Plan](https://example.com) ![Picture](https://example.com/image.png) <script>alert(1)</script>',
  );
  assert.ok(untrusted.includes('Plan'));
  assert.ok(untrusted.includes('Picture'));
  assert.ok(untrusted.includes('&lt;script&gt;'));
  for (const html of [title, task, untrusted]) {
    assert.ok(!/<(?:a|img|script|p|h[1-6]|div)(?:\s|>)/.test(html));
  }
});

test('locked images stay above newly lifted notes and images, with stable order among locks', () => {
  const notes = [{ id: 'note', z: 1000 }];
  const images = [
    { id: 'locked', z: 1, locked: true },
    { id: 'newer-lock', z: 3, locked: true },
    { id: 'normal', z: 2000 },
  ];
  const order = stackingOrder(notes, images);
  assert.ok(order.get('image:locked') > order.get('image:normal'));
  assert.ok(order.get('image:locked') > order.get('note:note'));
  assert.ok(order.get('image:newer-lock') > order.get('image:locked'));
  const unlocked = stackingOrder(
    notes,
    images.map((image) => (image.id === 'locked' ? { ...image, locked: false, z: 3000 } : image)),
  );
  assert.ok(unlocked.get('image:locked') > unlocked.get('image:normal'));
  assert.ok(unlocked.get('image:newer-lock') > unlocked.get('image:locked'));
});

test('image locks survive asset storage and backups while legacy images remain valid', async () => {
  const image = {
    id: 'lock-storage-test',
    x: 20,
    y: 30,
    width: 180,
    ratio: 1,
    src: 'data:image/png;base64,iVBORw0KGgo=',
    locked: true,
  };
  try {
    await imageAssets.patchScratchAssets({ upserts: [image] });
    const saved = (await imageAssets.readScratchAssets()).find((item) => item.id === image.id);
    assert.deepEqual(saved, image);
    const restored = backup.validateSettings({ scratchImagesData: JSON.stringify([saved]) });
    assert.deepEqual(JSON.parse(restored.settings.scratchImagesData), [image]);
    for (const locked of [undefined, false]) {
      assert.doesNotThrow(() =>
        backup.validateSettings({
          scratchImagesData: JSON.stringify([{ ...image, locked }]),
        }),
      );
    }
    assert.throws(() =>
      backup.validateSettings({
        scratchImagesData: JSON.stringify([{ ...image, locked: 'true' }]),
      }),
    );
  } finally {
    await imageAssets.patchScratchAssets({ removed: [image.id] });
  }
});

test('locked notes, lists and countdowns share the locked image stacking tier', () => {
  const notes = [
    { id: 'note', z: 2, locked: true },
    { id: 'list', type: 'checklist', z: 3, locked: true },
    { id: 'countdown', type: 'countdown', z: 4, locked: true },
    { id: 'normal', z: 10000 },
  ];
  const images = [
    { id: 'locked-image', z: 1, locked: true },
    { id: 'normal-image', z: 20000 },
  ];
  const order = stackingOrder(notes, images);
  for (const id of ['note:note', 'note:list', 'note:countdown', 'image:locked-image']) {
    assert.ok(order.get(id) > order.get('note:normal'));
    assert.ok(order.get(id) > order.get('image:normal-image'));
  }
  assert.ok(order.get('note:note') > order.get('image:locked-image'));
  assert.ok(order.get('note:list') > order.get('note:note'));
  assert.ok(order.get('note:countdown') > order.get('note:list'));
  const unlocked = stackingOrder(
    notes.map((note) => (note.id === 'list' ? { ...note, locked: false, z: 30000 } : note)),
    images,
  );
  assert.ok(unlocked.get('note:list') < unlocked.get('note:note'));
  assert.ok(unlocked.get('note:list') > unlocked.get('image:normal-image'));
});

test('note locks survive type changes and backup round-trips, with legacy notes accepted', () => {
  const note = {
    id: 'locked-note',
    x: 20,
    y: 30,
    text: 'Original text',
    locked: true,
    countdown: { ...spec },
    checklist: {
      title: 'Plan',
      items: [{ id: 'task', text: 'Review', depth: 0, completed: false }],
    },
  };
  let converted = note;
  for (const type of ['checklist', 'countdown', 'note']) {
    converted = noteTypes.switchNoteType(converted, type);
    assert.equal(converted.locked, true);
    const restored = backup.prepareBackup({ scratchNotesData: JSON.stringify([converted]) });
    assert.equal(JSON.parse(restored.settings.scratchNotesData)[0].locked, true);
  }
  for (const locked of [undefined, false]) {
    assert.doesNotThrow(() =>
      backup.validateSettings({ scratchNotesData: JSON.stringify([{ ...note, locked }]) }),
    );
  }
  assert.throws(() =>
    backup.validateSettings({ scratchNotesData: JSON.stringify([{ ...note, locked: 'true' }]) }),
  );
});

test('countdown progress fills from its saved start and clamps before the start and after the deadline', () => {
  const start = Date.parse('2026-11-01T12:00:00.000Z');
  const value = {
    ...spec,
    target: new Date(start + 4000).toISOString(),
    startedAt: new Date(start).toISOString(),
    style: 'progress',
  };
  assert.equal(countdown.countdownProgress(value, start - 1000), 0);
  assert.equal(countdown.countdownProgress(value, start), 0);
  assert.equal(countdown.countdownProgress(value, start + 1000), 0.25);
  assert.equal(countdown.countdownProgress(value, start + 2000), 0.5);
  assert.equal(countdown.countdownProgress(value, start + 4000), 1);
  assert.equal(countdown.countdownProgress(value, start + 9000), 1);
  assert.equal(countdown.countdownProgress(spec, start), 0);
});

test('countdown edits preserve the saved progress origin and initialise missing origins', () => {
  const initial = { ...spec, startedAt: '2026-11-01T12:00:00.000Z' };
  const now = Date.parse('2026-11-02T12:00:00.000Z');
  assert.equal(countdown.countdownStart(initial, now), initial.startedAt);
  assert.equal(
    countdown.countdownStart({ ...initial, target: '2026-11-06T12:00:00Z' }, now),
    initial.startedAt,
  );
  assert.equal(countdown.countdownStart(spec, now), new Date(now).toISOString());
});

test('countdown styles and their progress origin survive backups and note type changes', () => {
  for (const style of ['value', 'value-progress', 'progress']) {
    const timer = { ...spec, style, startedAt: '2026-11-01T12:00:00.000Z', text: 'Timer notes' };
    let note = noteTypes.rememberNoteType(
      { id: 'style', x: 1, y: 2, text: 'Original note' },
      'countdown',
      timer,
    );
    note = noteTypes.switchNoteType(note, 'note');
    const saved = backup.validateSettings({
      countdowns: JSON.stringify([{ ...timer, id: 'widget' }]),
      scratchNotesData: JSON.stringify([note]),
    });
    assert.deepEqual(JSON.parse(saved.settings.countdowns)[0], { ...timer, id: 'widget' });
    assert.deepEqual(
      noteTypes.switchNoteType(JSON.parse(saved.settings.scratchNotesData)[0], 'countdown')
        .countdown,
      timer,
    );
  }
  assert.equal(countdown.validCountdown(spec), true);
  assert.equal(countdown.validCountdown({ ...spec, style: 'invalid' }), false);
  assert.equal(countdown.validCountdown({ ...spec, startedAt: 'invalid' }), false);
});

test('countdown titles render Markdown while progress labels use readable text', async () => {
  const { default: Readout } = await server.ssrLoadModule(
    '/src/features/countdown/CountdownReadout.jsx',
  );
  const html = renderToStaticMarkup(
    React.createElement(Readout, {
      value: {
        ...spec,
        title: '# **Launch** _day_',
        style: 'progress',
        startedAt: '2026-10-01T12:00:00Z',
      },
    }),
  );
  assert.ok(html.includes('class="countdownTitle scratchNoteBody"'));
  assert.ok(html.includes('<h1><strong>Launch</strong> <em>day</em></h1>'));
  assert.ok(html.includes('aria-label="Launch day"'));
  const escaped = renderToStaticMarkup(
    React.createElement(Readout, {
      value: {
        ...spec,
        title: '<script>alert(1)</script>',
      },
    }),
  );
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(!escaped.includes('<script>'));
});

test('untitled countdowns and checklists remain valid through storage and backups', async () => {
  const timer = { ...spec, title: '', text: '**Notes**', style: 'progress' };
  const checklist = {
    title: '',
    items: [{ id: 'task', text: '*Task*', depth: 0, completed: false }],
  };
  assert.equal(countdown.validCountdown(timer), true);
  assert.equal(countdown.validCountdown({ ...timer, title: 'x'.repeat(201) }), false);
  localStorage.setItem('countdowns', JSON.stringify([{ ...timer, id: 'untitled' }]));
  assert.equal(countdown.readCountdownState().damaged, false);
  let note = noteTypes.rememberNoteType(
    { id: 'untitled-note', x: 1, y: 2, text: '' },
    'countdown',
    timer,
  );
  note = noteTypes.rememberNoteType(note, 'checklist', checklist);
  const restored = backup.validateSettings({
    countdowns: localStorage.getItem('countdowns'),
    scratchNotesData: JSON.stringify([note]),
  });
  const saved = JSON.parse(restored.settings.scratchNotesData)[0];
  assert.equal(noteTypes.switchNoteType(saved, 'countdown').countdown.title, '');
  assert.equal(noteTypes.switchNoteType(saved, 'checklist').checklist.title, '');
  const { default: Readout } = await server.ssrLoadModule(
    '/src/features/countdown/CountdownReadout.jsx',
  );
  const html = renderToStaticMarkup(React.createElement(Readout, { value: timer }));
  assert.ok(!html.includes('class="countdownTitle'));
  assert.ok(html.includes('aria-label="Countdown"'));
});

test('countdown readouts render the chosen value and bar combination with a keyboard-readable pill', async (t) => {
  const now = Date.parse('2026-11-01T12:00:00.000Z');
  t.mock.method(Date, 'now', () => now);
  const { default: Readout } = await server.ssrLoadModule(
    '/src/features/countdown/CountdownReadout.jsx',
  );
  const value = { ...spec, startedAt: new Date(now - 86400000).toISOString() };
  const render = (style) =>
    renderToStaticMarkup(React.createElement(Readout, { value: { ...value, style } }));
  const legacy = render(undefined);
  assert.ok(legacy.includes('class="countdownValue"'));
  assert.ok(!legacy.includes('<progress'));
  const combined = render('value-progress');
  assert.ok(combined.includes('class="countdownValue"'));
  assert.ok(combined.includes('<progress'));
  const bar = render('progress');
  assert.ok(!bar.includes('class="countdownValue"'));
  assert.ok(bar.includes('class="countdownProgressPill"'));
  assert.ok(bar.includes('tabindex="0"'));
  assert.ok(bar.includes('aria-valuetext='));
  const overlapping = renderToStaticMarkup(
    React.createElement(Readout, {
      value: { ...value, style: 'progress', target: new Date(now + 86400000).toISOString() },
    }),
  );
  assert.ok(overlapping.includes('class="countdownProgressPill isOverFill"'));
});

test('scratch note transparency overrides round-trip in mixed backups without changing inherited defaults', () => {
  const base = { x: 20, y: 30, text: 'Keep this' };
  const notes = [
    { ...base, id: 'inherited' },
    { ...base, id: 'transparent', transparent: true },
    { ...base, id: 'framed', transparent: false },
  ];
  const result = backup.validateSettings({ scratchNotesData: JSON.stringify(notes) });
  assert.deepEqual(JSON.parse(result.settings.scratchNotesData), notes);
  assert.throws(() =>
    backup.validateSettings({
      scratchNotesData: JSON.stringify([{ ...base, id: 'bad', transparent: 'false' }]),
    }),
  );
});

test('checklist percentages use the selected language before its preference is persisted', () => {
  localStorage.setItem('language', 'en_GB');
  assert.match(numbers.formatPercentage(0.5, 'ar'), /٥٠/);
  localStorage.setItem('language', 'ar');
  assert.equal(numbers.formatPercentage(0.5, 'en_GB'), '50%');
  localStorage.setItem('localeFormatting', 'false');
  assert.equal(numbers.formatPercentage(0.5, 'ar'), '50%');
});

test('scratch checklists preserve completion and nesting through backups and reject damaged lists', () => {
  const checklist = checklists.checklistFromNote('# Trip\n- Pack\n  - [x] Passport');
  const note = {
    id: 'list',
    x: 20,
    y: 30,
    text: checklists.checklistMarkdown(checklist),
    checklist,
  };
  const result = backup.validateSettings({ scratchNotesData: JSON.stringify([note]) });
  assert.deepEqual(JSON.parse(result.settings.scratchNotesData), [note]);
  assert.throws(() =>
    backup.validateSettings({
      scratchNotesData: JSON.stringify([
        { ...note, checklist: { ...checklist, items: [{ ...checklist.items[0], depth: 2 }] } },
      ]),
    }),
  );
  const remembered = { ...note, type: 'note', countdown: { ...spec, text: 'Timer notes' } };
  assert.deepEqual(
    JSON.parse(
      backup.validateSettings({ scratchNotesData: JSON.stringify([remembered]) }).settings
        .scratchNotesData,
    ),
    [remembered],
  );
});

test('all three note types retain their own content through repeated switching and backup restore', () => {
  const original = { id: 'versions', x: 10, y: 20, text: '**Original note**', transparent: false };
  const timer = { ...spec, text: '**Timer instructions**' };
  const checklist = checklists.checklistFromNote('# Packing\n- [x] Ticket\n  - [ ] Passport');
  let value = noteTypes.rememberNoteType(original, 'countdown', timer);
  value = noteTypes.rememberNoteType(value, 'checklist', checklist);
  for (let round = 0; round < 5; round++) {
    value = noteTypes.switchNoteType(value, 'note');
    assert.equal(noteTypes.noteBody(value), round ? `Note revision ${round - 1}` : original.text);
    value = noteTypes.updateNoteBody(value, `Note revision ${round}`);
    value = noteTypes.switchNoteType(value, 'countdown');
    assert.deepEqual(value.countdown, timer);
    assert.equal(noteTypes.noteBody(value), timer.text);
    value = noteTypes.switchNoteType(value, 'checklist');
    assert.deepEqual(value.checklist, checklist);
    assert.equal(value.text, `Note revision ${round}`);
    assert.equal(value.transparent, false);
    const stored = backup.validateSettings({ scratchNotesData: JSON.stringify([value]) });
    value = noteTypes.normalizeNoteMemories(JSON.parse(stored.settings.scratchNotesData)[0]);
  }
});

test('legacy countdown Markdown is copied into its type memory before note edits', () => {
  const original = { id: 'legacy', x: 10, y: 20, text: 'Legacy countdown notes', countdown: spec };
  let value = noteTypes.switchNoteType(original, 'note');
  value = noteTypes.updateNoteBody(value, 'New ordinary note');
  value = noteTypes.switchNoteType(value, 'countdown');
  assert.equal(noteTypes.noteBody(value), original.text);
  value = noteTypes.updateNoteBody(value, 'Edited countdown body');
  value = noteTypes.switchNoteType(value, 'note');
  assert.equal(noteTypes.noteBody(value), 'New ordinary note');
  assert.equal(value.countdown.text, 'Edited countdown body');
  assert.equal(original.countdown.text, undefined);
});

test('backup validation rejects broken active types and invalid remembered content', () => {
  const base = { id: 'bad-memory', x: 10, y: 20, text: 'Keep' };
  for (const fields of [
    { type: 'unknown' },
    { type: 'countdown' },
    { type: 'checklist' },
    { countdown: { ...spec, text: 3 } },
  ]) {
    assert.throws(() =>
      backup.validateSettings({ scratchNotesData: JSON.stringify([{ ...base, ...fields }]) }),
    );
  }
});

test('double-click creates one scratch only after the triple-click window', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const target = new EventTarget();
  const notes = [];
  const gesture = deferScratchGesture(target, (x, y) => notes.push([x, y]));
  gesture.schedule(200, 100);
  t.mock.timers.tick(699);
  assert.deepEqual(notes, []);
  t.mock.timers.tick(1);
  assert.deepEqual(notes, [[200, 100]]);
  gesture.dispose();
});

test('third press cancels a pending scratch, including slow triple-clicks', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const target = new EventTarget();
  const notes = [];
  const gesture = deferScratchGesture(target, () => notes.push('note'));
  gesture.schedule(200, 100);
  t.mock.timers.tick(650);
  const press = new Event('pointerdown');
  Object.assign(press, { button: 0, clientX: 220, clientY: 112 });
  target.dispatchEvent(press);
  t.mock.timers.tick(1000);
  assert.deepEqual(notes, []);
  gesture.schedule(300, 300);
  gesture.dispose();
  t.mock.timers.tick(1000);
  assert.deepEqual(notes, []);
});

test('countdowns use real elapsed time, exact hours and a reachable final deadline', () => {
  const start = Date.parse('2026-10-27T12:00:00Z');
  assert.equal(countdown.countdownText(spec, start, 'en'), 'in 9 days');
  assert.equal(countdown.countdownText({ ...spec, format: 'exact' }, start), '216h 00m');
  assert.equal(
    countdown.countdownText({ ...spec, format: 'seconds' }, start + 1000),
    '215h 59m 59s',
  );
  assert.equal(
    countdown.countdownText({ ...spec, format: 'exact' }, Date.parse(spec.target) + 5000),
    '0h 00m',
  );
  assert.equal(countdown.countdownDelay(spec, Date.parse(spec.target) - 1000), 1000);
  assert.equal(countdown.countdownDelay(spec, start), 300000);
  assert.equal(countdown.validCountdown({ ...spec, interval: 0 }), false);
  assert.equal(countdown.validCountdown({ ...spec, target: 'bad' }), false);
});

test('countdowns and scratch countdowns round-trip through backup without losing Markdown', () => {
  const item = { ...spec, id: 'trip', text: '# Checklist\n- [ ] Pack' };
  const note = { id: 'scratch', x: 25, y: 30, angle: -2, text: '**Notes**', countdown: spec };
  const input = {
    countdowns: JSON.stringify([item]),
    scratchNotesData: JSON.stringify([note]),
    focusSession: '{"phase":"focus"}',
  };
  const result = backup.validateSettings(input);
  assert.deepEqual(JSON.parse(result.settings.countdowns), [item]);
  assert.deepEqual(JSON.parse(result.settings.scratchNotesData), [note]);
  assert.ok(!Object.hasOwn(result.settings, 'focusSession'));
  assert.throws(() =>
    backup.validateSettings({
      scratchNotesData: JSON.stringify([{ ...note, countdown: { ...spec, target: 'invalid' } }]),
    }),
  );
  localStorage.setItem('countdowns', '{broken');
  assert.equal(countdown.readCountdownState().damaged, true);
  assert.equal(localStorage.getItem('countdowns'), '{broken');
});

test('Pomodoro catches up after suspension without resetting its deadlines', () => {
  localStorage.setItem('focusMode', 'pomodoro');
  focus.startFocus(0);
  const session = focus.readFocusSession();
  assert.equal(session.end, 25 * 60000);
  const onBreak = focus.advanceFocus(session, 26 * 60000);
  assert.equal(onBreak.phase, 'break');
  assert.equal(onBreak.end, 30 * 60000);
  assert.equal(focus.isFocusing(onBreak), false);
  const nextWork = focus.advanceFocus(session, 31 * 60000);
  assert.equal(nextWork.phase, 'work');
  assert.equal(nextWork.end, 55 * 60000);
  const longBreak = focus.advanceFocus(session, 115 * 60000);
  assert.equal(longBreak.phase, 'longBreak');
  assert.equal(longBreak.completed, 4);
  assert.equal(longBreak.end, 130 * 60000);
});

test('pausing Pomodoro preserves time remaining, and resume sets a new deadline', () => {
  localStorage.setItem('focusMode', 'pomodoro');
  focus.startFocus(0);
  focus.pauseFocus(5 * 60000);
  assert.equal(focus.readFocusSession().remaining, 20 * 60000);
  assert.equal(focus.isFocusing(), false);
  const paused = focus.readFocusSession();
  assert.deepEqual(focus.advanceFocus(paused, 90000000), paused);
  focus.pauseFocus(60 * 60000);
  assert.equal(focus.readFocusSession().end, 80 * 60000);
  focus.saveFocusSession(null);
  assert.equal(focus.readFocusSession(), null);
});

test('a tab opened during a Pomodoro break starts with widgets visible', (t) => {
  t.mock.method(Date, 'now', () => 26 * 60000);
  localStorage.setItem('focusMode', 'pomodoro');
  focus.startFocus(0);
  assert.equal(focus.isFocusing(), false);
});

test('Focus counter measures elapsed time for Focus and remaining time for timed phases', () => {
  assert.equal(focus.focusCounter({ phase: 'focus', started: 1000 }, 1000), '00:00');
  assert.equal(focus.focusCounter({ phase: 'focus', started: 1000 }, 62500), '01:01');
  assert.equal(focus.focusCounter({ phase: 'focus', started: 1000 }, 3662000), '1:01:01');
  assert.equal(focus.focusCounter({ phase: 'work', end: 1500000 }, 1000), '24:59');
  assert.equal(focus.focusCounter({ phase: 'break', end: 300000 }, 310000), '00:00');
  assert.equal(
    focus.focusCounter({ phase: 'work', paused: true, remaining: 61000 }, 9000000),
    '01:01',
  );
});

test('Focus and work-shift fallback follow active sessions and overnight shift days', () => {
  localStorage.setItem('fallbackBackgroundType', 'colour');
  localStorage.setItem('focusFallbackBackground', 'true');
  focus.startFocus();
  assert.equal(fallback.shouldUseFallback(), true);
  focus.saveFocusSession(null);
  assert.equal(fallback.shouldUseFallback(), false);
  localStorage.setItem('percentageFallbackBackground', 'true');
  localStorage.setItem('timeType', 'percentageComplete');
  localStorage.setItem('percentageStart', '22:00');
  localStorage.setItem('percentageEnd', '06:00');
  localStorage.setItem('percentageDays', '[1]');
  assert.equal(fallback.shouldUseFallback(new Date(2026, 9, 27, 2)), true); // Tuesday's early hours belong to Monday.
  assert.equal(fallback.shouldUseFallback(new Date(2026, 9, 27, 12)), false);
});

test('an empty primary provider recovers to the configured fallback without changing it', async () => {
  const loader = await server.ssrLoadModule('/src/features/background/api/backgroundLoader.js');
  localStorage.setItem('backgroundType', 'unavailable-fixture');
  localStorage.setItem('fallbackBackgroundType', 'colour');
  localStorage.setItem('fallbackBackgroundColour', '#20242c');
  const result = await loader.getBackgroundData();
  assert.equal(result.sourceRole, 'fallback');
  assert.equal(result.style, 'background: #20242c');
  assert.equal(localStorage.getItem('backgroundType'), 'unavailable-fixture');
  localStorage.setItem('fallbackBackgroundType', 'unavailable-fixture');
  assert.equal((await loader.getBackgroundData()).photoInfo.offline, true);
});

test('world clocks validate zones and follow 12/24-hour and seconds settings', () => {
  assert.equal(world.validTimezone('Europe/London'), true);
  assert.equal(world.validTimezone('Invalid/Zone'), false);
  localStorage.setItem('timeformat', 'twentyfourhour');
  const date = new Date('2026-10-27T14:05:09Z');
  assert.match(world.worldClockTime(date, 'UTC'), /14:05/);
  localStorage.setItem('timeformat', 'twelvehour');
  localStorage.setItem('seconds', 'true');
  assert.match(world.worldClockTime(date, 'UTC'), /2:05:09/);
  const clocks = [{ id: 'london', label: 'London', zone: 'Europe/London' }];
  assert.deepEqual(
    JSON.parse(
      backup.validateSettings({ worldClocks: JSON.stringify(clocks) }).settings.worldClocks,
    ),
    clocks,
  );
  assert.throws(() =>
    backup.validateSettings({ worldClocks: '[{"id":"bad","label":"Bad","zone":"Invalid/Zone"}]' }),
  );
});

test('Portfolio keeps the last quote on a failed refresh and marks it as failed', async (t) => {
  const holdings = [{ symbol: 'AAPL', shares: 2 }];
  localStorage.setItem('portfolioHoldings', JSON.stringify(holdings));
  localStorage.setItem('portfolioProvider', 'twelvedata');
  localStorage.setItem('portfolioTwelveDataApiKey', 'test-key');
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ close: '200', previous_close: '195', currency: 'USD' }),
  }));
  const fresh = await portfolio.loadPortfolio(holdings, 'twelvedata', true);
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Offline');
  });
  const stale = await portfolio.loadPortfolio(holdings, 'twelvedata', true);
  assert.deepEqual(stale.quotes, fresh.quotes);
  assert.deepEqual(stale.failed, ['AAPL']);
  assert.equal(portfolio.portfolioTotals(holdings, stale.quotes).value, 400);
  assert.ok(!localStorage.getItem('portfolioQuoteCache').includes('test-key'));
});

test('Portfolio discards a damaged transient quote cache instead of rendering invalid rows', () => {
  const holdings = [{ symbol: 'AAPL', shares: 2 }];
  const stamp = JSON.stringify(['finnhub', [['AAPL', '', 2, undefined]]]);
  localStorage.setItem(
    'portfolioQuoteCache',
    JSON.stringify({ stamp, updated: Date.now(), quotes: { 'AAPL|': null } }),
  );
  assert.equal(portfolio.readPortfolioCache(holdings, 'finnhub'), null);
});

test('Portfolio preserves more than eight holdings through storage and backups', () => {
  const holdings = Array.from({ length: 20 }, (_, i) => ({ symbol: `STOCK${i}`, shares: i + 1 }));
  localStorage.setItem('portfolioHoldings', JSON.stringify(holdings));
  assert.deepEqual(portfolio.readHoldingsState(), { holdings, damaged: false });
  assert.deepEqual(
    JSON.parse(
      backup.prepareBackup({ portfolioHoldings: JSON.stringify(holdings) }).settings
        .portfolioHoldings,
    ),
    holdings,
  );
  const quotes = Object.fromEntries(
    holdings.map((holding) => [
      portfolio.holdingId(holding),
      { price: 10, previous: 9, currency: 'USD' },
    ]),
  );
  const totals = portfolio.portfolioTotals(holdings, quotes);
  assert.equal(totals.complete, true);
  assert.equal(totals.value, 2100);
  assert.equal(totals.rows.length, 20);
  assert.deepEqual(
    portfolio.topHoldings(totals.rows).map((row) => row.symbol),
    ['STOCK19', 'STOCK18', 'STOCK17', 'STOCK16', 'STOCK15', 'STOCK14', 'STOCK13', 'STOCK12'],
  );
  assert.equal(totals.rows[0].symbol, 'STOCK0');
});

test('Portfolio includes major holdings even when their daily change is unavailable', () => {
  const rows = [
    { symbol: 'SMALL', value: 10, day: 5 },
    { symbol: 'LARGE', value: 1000, day: null },
  ];
  assert.deepEqual(
    portfolio.topHoldings(rows).map((row) => row.symbol),
    ['LARGE', 'SMALL'],
  );
});

test('Markdown task lists render a checkbox once and keep raw HTML inert', async () => {
  const { default: Markdown } = await server.ssrLoadModule('/src/features/scratch/Markdown.jsx');
  const html = renderToStaticMarkup(
    React.createElement(Markdown, {
      text: '- [ ] Pack\n\n<script>alert(1)</script>\n\n[Bad](javascript:alert(1))',
    }),
  );
  assert.equal((html.match(/type="checkbox"/g) || []).length, 1);
  assert.ok(!html.includes('[ ]'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
});

test('new feature labels and countdown text use the selected language', async () => {
  const { TranslationProvider } = await server.ssrLoadModule(
    '/src/contexts/TranslationContext.jsx',
  );
  const { default: CountdownReadout } = await server.ssrLoadModule(
    '/src/features/countdown/CountdownReadout.jsx',
  );
  const render = (Component, props = {}) =>
    renderToStaticMarkup(
      React.createElement(TranslationProvider, null, React.createElement(Component, props)),
    );
  try {
    await translations.selectLanguage('bg');
    assert.equal(translations.uiText('fallback_background'), 'Резервен фон');
    assert.equal(translations.uiText('countdown_datetime'), 'Дата и час (местно време)');
    assert.equal(translations.uiText('fallback_source'), 'Източник (резервен)');
    const readout = render(CountdownReadout, {
      value: {
        title: 'My own title',
        target: new Date(Date.now() + 9 * 86400000).toISOString(),
        interval: 300,
        format: 'human',
      },
    });
    assert.ok(readout.includes('My own title'));
    assert.ok(readout.includes('след 9 дни'));
    await translations.selectLanguage('en_GB');
    assert.equal(translations.uiText('focus_action'), 'Button action');
    assert.equal(
      translations
        .translationSnapshot()
        .instance.getMessage('en_GB', 'modals.main.settings.sections.rss.title'),
      'Feeds',
    );
  } finally {
    await translations.selectLanguage('en_GB');
  }
});
