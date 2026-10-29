import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

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
globalThis.browser = {
  storage: {
    local: {
      get: async () => ({
        googleAuth: { accessToken: 'fixture', expiresAt: Date.now() + 3600000 },
      }),
    },
  },
};
const originalFetch = globalThis.fetch;
const server = await createServer({
  server: { middlewareMode: true, hmr: false, open: false },
  logLevel: 'silent',
});
const calendar = await server.ssrLoadModule('/src/features/google/services/calendar.js');
const details = await server.ssrLoadModule('/src/features/google/eventDetails.js');
const maps = await server.ssrLoadModule('/src/features/google/services/eventMap.js');
const translations = await server.ssrLoadModule('/src/lib/translations.js');
await translations.selectLanguage('en_GB');
after(async () => {
  globalThis.fetch = originalFetch;
  await server.close();
});
beforeEach(() => {
  localStorage.clear();
  calendar.clearEventDetailsCache();
});
const response = (data, status = 200) => ({
  ok: status < 400,
  status,
  text: async () => JSON.stringify(data),
  json: async () => data,
});
const context = {
  id: 'team@example.com',
  summary: 'Team',
  accessRole: 'owner',
  timeZone: 'Europe/Sofia',
  defaultReminders: [{ method: 'popup', minutes: 15 }],
};
const raw = {
  id: 'instance',
  summary: 'Planning',
  start: { dateTime: '2026-10-29T10:00:00+02:00', timeZone: 'Europe/Sofia' },
  end: { dateTime: '2026-10-29T11:00:00+02:00' },
  description: '<b>Agenda</b>',
  location: 'Berlin',
  recurringEventId: 'series',
  attendees: [{ email: 'you@example.com', self: true, responseStatus: 'tentative' }],
  organizer: { email: 'host@example.com' },
  creator: { displayName: 'Creator' },
  reminders: { useDefault: true },
  attachments: [{ title: 'Agenda', fileUrl: 'https://example.com/doc' }],
  conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://example.com/call' }] },
  visibility: 'private',
  transparency: 'transparent',
  guestsCanModify: true,
  created: '2026-10-01T12:00:00Z',
};

test('agenda normalization preserves event options, guests, timezones and calendar reminders', () => {
  const event = calendar.toEvent(raw, context);
  assert.equal(event.canEdit, true);
  assert.equal(event.timeZone, 'Europe/Sofia');
  assert.deepEqual(event.defaultReminders, context.defaultReminders);
  for (const key of [
    'attendees',
    'organizer',
    'creator',
    'attachments',
    'conferenceData',
    'visibility',
    'transparency',
    'guestsCanModify',
    'created',
  ])
    assert.deepEqual(event[key], raw[key]);
  assert.equal(calendar.toEvent({ ...raw, locked: true }, context).canEdit, false);
  assert.equal(calendar.toEvent(raw, { ...context, accessRole: 'reader' }).canEdit, false);
});

test('expanded event details fetch parent recurrence without overwriting instance changes', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url).pathname);
    return response(
      url.endsWith('/series')
        ? {
            id: 'series',
            summary: 'Parent title',
            location: 'Old place',
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,TH;COUNT=8'],
            start: { dateTime: '2026-10-01T10:00:00+03:00' },
          }
        : raw,
    );
  };
  const event = calendar.toEvent(raw, context);
  const result = await calendar.getEventDetails(event, { account: 'first' });
  assert.equal(calls.length, 2);
  assert.deepEqual(result.recurrence, ['RRULE:FREQ=WEEKLY;BYDAY=MO,TH;COUNT=8']);
  assert.equal(result.title, 'Planning');
  assert.equal(result.location, 'Berlin');
  assert.equal(result.start, raw.start.dateTime);
  await calendar.getEventDetails(event, { account: 'first' });
  assert.equal(calls.length, 2);
  await calendar.getEventDetails({ ...event, id: 'second-instance' }, { account: 'first' });
  assert.equal(calls.length, 3, 'parent series is cached across instances');
  await calendar.getEventDetails(event, { account: 'other' });
  assert.equal(calls.length, 5, 'another account cannot reuse private details');
  localStorage.setItem('googleAuthRevision', 'changed');
  await calendar.getEventDetails(event, { account: 'other' });
  assert.equal(calls.length, 7);
});

test('a missing recurrence parent leaves instance details available', async () => {
  globalThis.fetch = async (url) =>
    url.endsWith('/series') ? response({ error: { message: 'Not found' } }, 404) : response(raw);
  const result = await calendar.getEventDetails(calendar.toEvent(raw, context));
  assert.equal(result.title, raw.summary);
  assert.equal(result.recurrenceUnavailable, true);
  assert.equal(result.attendees.length, 1);
});

test('a changed calendar role or default reminders cannot reuse obsolete detail permissions', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return response({ ...raw, recurringEventId: '' });
  };
  const event = calendar.toEvent(raw, context);
  assert.equal((await calendar.getEventDetails(event)).canEdit, true);
  assert.equal((await calendar.getEventDetails({ ...event, accessRole: 'reader' })).canEdit, false);
  const changed = await calendar.getEventDetails({ ...event, defaultReminders: [] });
  assert.deepEqual(changed.defaultReminders, []);
  assert.equal(calls, 3);
});

test('aborts and account changes cannot populate Calendar detail caches', async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return response(raw);
  };
  await assert.rejects(
    calendar.getEventDetails(calendar.toEvent(raw, context), { signal: controller.signal }),
    { name: 'AbortError' },
  );
  assert.equal(calls, 0);
  globalThis.fetch = async () => {
    localStorage.setItem('googleAuthRevision', 'replaced');
    return response(raw);
  };
  await assert.rejects(calendar.getEventDetails(calendar.toEvent(raw, context)), {
    name: 'AbortError',
  });
});

test('recurrence summaries handle intervals, ordinals, endings and complex rule fallbacks', () => {
  assert.match(
    details.recurrenceText(['RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH;COUNT=8'], {
      locale: 'en-GB',
    }),
    /Every 2 weeks.*Monday, Thursday.*8 occurrences/,
  );
  assert.match(
    details.recurrenceText(['RRULE:FREQ=MONTHLY;BYDAY=1MO;UNTIL=20261231'], { locale: 'en-GB' }),
    /First Monday.*31 Dec 2026/,
  );
  assert.equal(
    details.recurrenceText(['RRULE:FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU']),
    'Custom recurrence',
  );
  assert.equal(details.recurrenceText(['RDATE:20261029']), 'Custom recurrence');
  assert.equal(details.recurrenceText([]), '');
});

test('all-day end dates are exclusive and timed details honor event timezone', () => {
  assert.equal(details.eventEnd({ allDay: true, end: '2026-11-02' }), '2026-11-01');
  assert.equal(details.eventEnd({ allDay: true, end: '2026-03-30' }), '2026-03-29');
  assert.match(
    details.eventDate('2026-10-29T12:00:00Z', { locale: 'en-GB', timeZone: 'Europe/Sofia' }),
    /14:00/,
  );
  assert.match(
    details.eventDate('2026-10-29T12:00:00Z', {
      locale: 'en-GB',
      timeZone: 'Europe/Sofia',
      use24Hour: false,
    }),
    /02:00 pm/i,
  );
  assert.equal(details.eventDate('broken'), '');
  assert.equal(details.eventUrl('javascript:alert(1)'), null);
  assert.equal(details.eventUrl('data:text/html,broken'), null);
  assert.equal(details.eventUrl('https://example.com'), 'https://example.com/');
  assert.equal(
    details.reminderText({ method: 'popup', minutes: 0 }, 'en-GB'),
    'Notification at the start',
  );
  assert.equal(
    details.reminderText({ method: 'email', minutes: 1440 }, 'en-GB'),
    'Email 1 day before',
  );
});

test('event status respects exact boundaries and exclusive all-day ends', () => {
  const event = { start: '2026-10-29T09:00:00Z', end: '2026-10-29T10:00:00Z' };
  assert.equal(details.calendarEventStatus(event, Date.parse('2026-10-29T08:59:59Z')), '');
  assert.equal(details.calendarEventStatus(event, Date.parse(event.start)), 'in_progress');
  assert.equal(details.calendarEventStatus(event, Date.parse(event.end)), 'passed');
  assert.equal(
    details.calendarEventStatus({ ...event, endTimeUnspecified: true }, Date.parse(event.end)),
    '',
  );
  assert.equal(details.calendarEventStatus({ start: 'invalid' }), '');
  const allDay = { allDay: true, start: '2026-10-29', end: '2026-10-30' };
  assert.equal(
    details.calendarEventStatus(allDay, new Date(2026, 9, 29, 23, 59).getTime()),
    'in_progress',
  );
  assert.equal(details.calendarEventStatus(allDay, new Date(2026, 9, 30).getTime()), 'passed');
});

test('organizer display resolves people rather than secondary calendar names without guessing ownership', () => {
  const viewer = { name: 'Alex Example', email: 'alex@example.com' };
  const event = {
    calendarName: 'Life',
    organizer: { displayName: 'Life', email: 'abc@group.calendar.google.com', self: true },
    creator: { email: 'alex@example.com' },
  };
  assert.equal(details.eventOrganizer(event, viewer).displayName, 'Alex Example');
  assert.equal(details.eventOrganizer(event, viewer).email, viewer.email);
  assert.equal(
    details.eventOrganizer(
      { ...event, creator: { displayName: 'Sam', email: 'sam@example.com' } },
      viewer,
    ).displayName,
    'Sam',
  );
  assert.equal(details.eventOrganizer({ ...event, creator: null }, viewer), null);
  assert.equal(details.eventOrganizer({ creator: event.creator }, viewer), null);
  const external = {
    ...event,
    organizer: { email: 'host@example.com' },
    attendees: [{ email: 'host@example.com', displayName: 'Meeting Host' }],
  };
  assert.equal(details.eventOrganizer(external, viewer).displayName, 'Meeting Host');
  assert.equal(details.eventOrganizer(external, viewer).email, 'host@example.com');
  assert.equal(details.eventOrganizer({ ...external, attendees: [] }, viewer).displayName, '');
  assert.equal(
    details.eventOrganizer(
      { ...event, organizer: { email: 'alex@example.com', displayName: 'Life' } },
      viewer,
    ).displayName,
    viewer.name,
  );
});

test('map coordinates validate ranges and build bounded OpenStreetMap embeds', async () => {
  assert.deepEqual(maps.locationCoordinates('52.52,13.405'), {
    lat: 52.52,
    lon: 13.405,
    label: '52.52,13.405',
  });
  assert.equal(maps.locationCoordinates('91,0'), null);
  assert.equal(maps.locationCoordinates('0,181'), null);
  assert.equal(maps.locationCoordinates('https://openstreetmap.org/'), null);
  assert.equal(
    maps.locationCoordinates('https://www.openstreetmap.org/?mlat=52.52&mlon=13.405').lat,
    52.52,
  );
  const frame = new URL(maps.mapLinks({ lat: 90, lon: 180 }).embed);
  const [left, bottom, right, top] = frame.searchParams.get('bbox').split(',').map(Number);
  assert.ok(left < right && bottom < top && top <= 85.0511);
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Unexpected geocode');
  };
  await maps.findEventPlaces('geo:52.52,13.405');
  assert.equal(calls, 0);
});

test('map lookup is credential-free, cached per account, and handles no results and offline mode', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return response({
      features: [
        {
          geometry: { type: 'Point', coordinates: [13.405, 52.52] },
          properties: { name: 'Berlin', city: 'Berlin', country: 'Germany' },
        },
      ],
    });
  };
  const result = await maps.findEventPlaces('fixture-city', { scope: 'first' });
  assert.equal(result[0].label, 'Berlin, Germany');
  await maps.findEventPlaces('fixture-city', { scope: 'first' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.headers, undefined);
  assert.equal(new URL(calls[0].url).searchParams.get('q'), 'fixture-city');
  await maps.findEventPlaces('fixture-city', { scope: 'other' });
  assert.equal(calls.length, 2);
  globalThis.fetch = async () => response({ features: [] });
  assert.deepEqual(await maps.findEventPlaces('unknown-fixture'), []);
  localStorage.setItem('offlineMode', 'true');
  await assert.rejects(maps.findEventPlaces('fixture-city', { scope: 'first' }), /offline/);
});

test('new recurring timed events include their expansion timezone', async () => {
  let body;
  globalThis.fetch = async (url, options) => {
    body = JSON.parse(options.body);
    return response({ id: 'created', ...body });
  };
  await calendar.createEvent({
    title: 'Review',
    start: '2027-03-10T09:00:00Z',
    end: '2027-03-10T10:00:00Z',
    allDay: false,
    recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=WE'],
  });
  assert.equal(body.start.timeZone, Intl.DateTimeFormat().resolvedOptions().timeZone);
  assert.equal(body.end.timeZone, body.start.timeZone);
});
