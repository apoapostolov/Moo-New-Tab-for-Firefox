import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  calendarAlertInstant,
  calendarAlertTone,
  alertOccurrence,
  scheduledCalendarEvents,
  validEventReminders,
  eventReminders,
  reminderForm,
} from '../src/features/google/calendarAlerts.js';

const source = await readFile(new URL('../manifest/calendar-alerts.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const { createCalendarAlerts } = context.MooCalendarAlerts;
const event = {
  calendarId: 'primary',
  id: 'one',
  title: 'Planning',
  start: '2026-10-30T12:00:00Z',
  end: '2026-10-30T13:00:00Z',
  reminders: { useDefault: true },
  defaultReminders: [
    { method: 'popup', minutes: 10 },
    { method: 'email', minutes: 30 },
  ],
};

test('Google reminder payloads retain defaults, none, email and popup while stripping editor ids', () => {
  assert.deepEqual(eventReminders(reminderForm()), { useDefault: true });
  assert.deepEqual(eventReminders({ useDefault: false, overrides: [] }), {
    useDefault: false,
    overrides: [],
  });
  assert.deepEqual(
    eventReminders(
      reminderForm({ useDefault: false, overrides: [{ method: 'email', minutes: 40320 }] }),
    ),
    { useDefault: false, overrides: [{ method: 'email', minutes: 40320 }] },
  );
  for (const overrides of [
    [null],
    [{ method: 'sms', minutes: 5 }],
    [{ method: 'popup', minutes: -1 }],
    [{ method: 'popup', minutes: 1.5 }],
    [{ method: 'popup', minutes: 40321 }],
    Array(6).fill({ method: 'popup', minutes: 5 }),
  ])
    assert.equal(validEventReminders({ useDefault: false, overrides }), false);
});
test('all-day alerts respect calendar midnight across timezone and DST boundaries', () => {
  assert.equal(
    new Date(calendarAlertInstant('2026-10-25', 'Europe/Sofia')).toISOString(),
    '2026-10-24T21:00:00.000Z',
  );
  assert.equal(
    new Date(calendarAlertInstant('2026-10-26', 'Europe/Sofia')).toISOString(),
    '2026-10-25T22:00:00.000Z',
  );
});
test('warning windows and delivered alert precedence end with the event', () => {
  const settings = { amberEnabled: true, amberMinutes: 30, redEnabled: true, redMinutes: 5 };
  const start = Date.parse(event.start),
    fired = { [alertOccurrence(event)]: start - 600000 };
  assert.equal(calendarAlertTone(event, settings, {}, start - 31 * 60000), '');
  assert.equal(calendarAlertTone(event, settings, {}, start - 30 * 60000), 'amber');
  assert.equal(calendarAlertTone(event, settings, {}, start - 5 * 60000), 'red');
  assert.equal(calendarAlertTone(event, settings, fired, start - 5 * 60000), 'green');
  assert.equal(calendarAlertTone(event, settings, fired, Date.parse(event.end)), '');
  assert.equal(calendarAlertTone({ ...event, declined: true }, settings, fired, start), '');
  assert.deepEqual(scheduledCalendarEvents([event])[0].minutes, [10]);
});
function fixture() {
  let now = Date.parse('2026-10-30T11:00:00Z'),
    permission = true,
    fail = false;
  const storage = { googleAuth: { email: 'fixture@example.com', connectedAt: 1 } },
    alarms = new Map([['unrelated', { name: 'unrelated' }]]),
    notifications = [];
  const api = {
    storage: {
      local: {
        get: async (key) => structuredClone({ [key]: storage[key] }),
        set: async (value) => Object.assign(storage, structuredClone(value)),
        remove: async (key) => {
          delete storage[key];
        },
      },
    },
    permissions: { contains: async () => permission },
    alarms: {
      getAll: async () => [...alarms.values()],
      clear: async (name) => alarms.delete(name),
      create: async (name, options) => alarms.set(name, { name, ...options }),
    },
    notifications: {
      create: async (name, options) => {
        if (fail) throw Error('blocked');
        notifications.push({ name, ...options });
        return name;
      },
    },
    runtime: { getURL: (path) => path },
  };
  const engine = createCalendarAlerts(api, () => now),
    snapshot = {
      account: 'fixture@example.com:1',
      updated: now,
      events: scheduledCalendarEvents([event]),
    };
  return {
    api,
    engine,
    storage,
    alarms,
    notifications,
    snapshot,
    setNow: (value) => {
      now = value;
    },
    permission: (value) => {
      permission = value;
    },
    fail: (value) => {
      fail = value;
    },
    due: () => [...alarms.values()].find((a) => a.name !== 'unrelated'),
  };
}
test('background alarms deliver once, persist green, and survive reopening without duplicates', async () => {
  const x = fixture();
  await x.engine.sync(x.snapshot);
  const alarm = x.due();
  assert.equal(alarm.when, Date.parse(event.start) - 600000);
  x.setNow(alarm.when);
  await Promise.all([x.engine.fire(alarm), x.engine.fire(alarm)]);
  assert.equal(x.notifications.length, 1);
  assert.ok(x.storage.mooCalendarAlerts.fired[alertOccurrence(event)]);
  await createCalendarAlerts(x.api, () => alarm.when).restore();
  await x.engine.sync(x.snapshot);
  assert.equal(x.due(), undefined);
  assert.ok(x.alarms.has('unrelated'));
});
test('permission denial or failed OS delivery never turns an event green', async () => {
  const x = fixture();
  await x.engine.sync(x.snapshot);
  const alarm = x.due();
  x.setNow(alarm.when);
  x.fail(true);
  await assert.rejects(x.engine.fire(alarm));
  assert.deepEqual(x.storage.mooCalendarAlerts.fired, {});
  x.permission(false);
  await x.engine.fire(alarm);
  assert.equal(x.storage.mooCalendarAlerts, undefined);
  assert.equal(x.notifications.length, 0);
});
test('edits and deletion invalidate older syncs; a newer snapshot can schedule the edited event', async () => {
  const x = fixture();
  await x.engine.sync(x.snapshot);
  x.setNow(x.snapshot.updated + 100);
  await x.engine.remove('primary:one');
  await x.engine.sync(x.snapshot);
  assert.equal(x.due(), undefined);
  await x.engine.sync({ ...x.snapshot, updated: x.snapshot.updated + 200 });
  assert.ok(x.due());
  x.storage.googleAuth = { email: 'other@example.com', connectedAt: 2 };
  await x.engine.restore();
  assert.equal(x.storage.mooCalendarAlerts, undefined);
});
test('restart drops old alerts, restores recent missed alerts and clears only its own alarms', async () => {
  const x = fixture();
  await x.engine.sync(x.snapshot);
  const alarm = x.due();
  x.setNow(alarm.when + 4 * 60000);
  await x.engine.restore();
  assert.ok(x.due());
  x.setNow(alarm.when + 6 * 60000);
  await x.engine.restore();
  assert.equal(x.due(), undefined);
  await x.engine.clear();
  assert.equal(x.storage.mooCalendarAlerts, undefined);
  assert.ok(x.alarms.has('unrelated'));
});
