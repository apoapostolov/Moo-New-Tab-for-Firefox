import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseNatural, toRrule } from '../src/features/google/natural.js';
import { EVENT_EXAMPLES, TASK_EXAMPLES } from '../src/features/google/examples.js';
import { eventFormFromNatural, taskFormFromNatural } from '../src/features/google/naturalForms.js';
const now = new Date(2026, 9, 29, 12, 10);
const parse = (text, kind = 'event', extra = {}) => parseNatural(text, { now, kind, ...extra });
const stamp = (d) =>
  d &&
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('end-of phrases remove the complete clause in Calendar and Tasks', () => {
  for (const [phrase, day] of [
    ['Finish by end of tomorrow', '2026-10-30'],
    ['Finish at the end of February 2028', '2028-02-29'],
    ['Finish end of year', '2026-12-31'],
  ]) {
    const event = parse(phrase);
    assert.equal(event.title, 'Finish');
    assert.equal(stamp(event.date), day);
    assert.deepEqual(event.time, { hours: 23, minutes: 59 });
    const task = parse(phrase, 'task');
    assert.equal(task.title, 'Finish');
    assert.equal(stamp(task.date), day);
    assert.equal(task.time, null);
  }
});

test('calendar clauses can appear before or after the title without absorbing other fields', () => {
  for (const text of [
    'Tomorrow from 9 to 10:30, planning at the office; notes: Bring the Q4 figures',
    'planning at the office tomorrow from 9 to 10:30; notes: Bring the Q4 figures',
  ]) {
    const p = parse(text);
    assert.equal(p.title, 'planning');
    assert.equal(stamp(p.date), '2026-10-30');
    assert.deepEqual(p.time, { hours: 9, minutes: 0 });
    assert.deepEqual(p.endTime, { hours: 10, minutes: 30 });
    assert.equal(p.location, 'the office');
    assert.equal(p.notes, 'Bring the Q4 figures');
  }
  const p = parse(
    'At "Studio 54", on 12 November 2027 from 9am until 5pm, design review; notes: "Discuss tomorrow at 10"',
  );
  assert.equal(p.title, 'design review');
  assert.equal(p.location, 'Studio 54');
  assert.equal(stamp(p.date), '2027-11-12');
  assert.equal(p.notes, 'Discuss tomorrow at 10');
  assert.equal(p.time.hours, 9);
  assert.equal(p.endTime.hours, 17);
});
test('compound lengths, colloquial clocks and relative times retain precise minutes', () => {
  const p = parse('For an hour and a half tomorrow at half past nine in the morning, team review');
  assert.equal(p.title, 'team review');
  assert.equal(p.durationMinutes, 90);
  assert.deepEqual(p.time, { hours: 9, minutes: 30 });
  assert.equal(parse('Review tomorrow at 9 for 1h30m').durationMinutes, 90);
  assert.equal(parse('Review tomorrow at 9 for two hours and twenty minutes').durationMinutes, 140);
  assert.equal(parse('Review tomorrow at quarter to five in the afternoon').time.hours, 16);
  const relative = parse('Call the bank in one hour and twenty minutes');
  assert.equal(relative.title, 'Call the bank');
  assert.deepEqual(relative.time, { hours: 13, minutes: 30 });
  assert.deepEqual(parse('Support shift from 9 to 5pm tomorrow').time, { hours: 9, minutes: 0 });
  assert.deepEqual(parse('Deployment tomorrow at 11pm until 1am').endTime, {
    hours: 1,
    minutes: 0,
  });
});
test('recurrence supports weekday lists, intervals, monthly positions and explicit boundaries', () => {
  const p = parse(
    'Every other week on Monday and Thursday at 4pm for 45 minutes starting 2 November 2026 for six occurrences: Design review',
  );
  assert.equal(p.title, 'Design review');
  assert.equal(stamp(p.date), '2026-11-02');
  assert.equal(p.durationMinutes, 45);
  assert.equal(toRrule(p.repeat), 'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH;COUNT=6');
  const monthly = parse(
    'Budget check every last Friday of the month at noon until 31 December 2027',
  );
  assert.equal(stamp(monthly.date), '2026-10-30');
  assert.equal(
    toRrule(monthly.repeat),
    'RRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1;UNTIL=' +
      new Date(2027, 11, 31, 23, 59, 59).toISOString().replace(/[-:]|\.000/g, ''),
  );
  assert.equal(
    toRrule(parse('Rent every month on the 1st for one occurrence').repeat),
    'RRULE:FREQ=MONTHLY;BYMONTHDAY=1;COUNT=1',
  );
});
test('date ranges, explicit bounds and all-day lengths retain both endpoints', () => {
  const p = parse(
    'Holiday from 2026-12-24 through 2027-01-03 all day; notes: Offline until Monday',
  );
  assert.equal(p.title, 'Holiday');
  assert.equal(stamp(p.date), '2026-12-24');
  assert.equal(stamp(p.endDate), '2027-01-03');
  assert.equal(p.allDay, true);
  assert.equal(p.notes, 'Offline until Monday');
  const bound = parse('Conference; ends 13 Nov 2026 at 5pm; starts 12 Nov 2026 at 9am');
  assert.equal(bound.title, 'Conference');
  assert.equal(stamp(bound.date), '2026-11-12');
  assert.equal(stamp(bound.endDate), '2026-11-13');
  assert.equal(bound.time.hours, 9);
  assert.equal(bound.endTime.hours, 17);
  assert.equal(stamp(parse('Leave tomorrow for three days').endDate), '2026-11-01');
  assert.equal(stamp(parse('Offsite 3-5 dec').endDate), '2026-12-05');
});
test('task dates, notes and explicit status are supported while clocks and repeats stay in the title', () => {
  const p = parse(
    'Please remind me to send the invoice by the day after tomorrow; notes: Ask for a receipt; status: done',
    'task',
  );
  assert.equal(p.title, 'send the invoice');
  assert.equal(stamp(p.date), '2026-10-31');
  assert.equal(p.notes, 'Ask for a receipt');
  assert.equal(p.status, 'completed');
  const unsupported = parse('Water plants every Monday at 9am', 'task');
  assert.equal(unsupported.title, 'Water plants every Monday at 9am');
  assert.equal(unsupported.date, null);
  assert.equal(
    parse('Write at least two paragraphs tomorrow', 'task').title,
    'Write at least two paragraphs',
  );
  assert.equal(stamp(parse('Submit report in two business days', 'task').date), '2026-11-02');
});
test('invalid dates, invalid clocks and quoted literals do not get silently rescheduled', () => {
  for (const text of [
    'February 30 2027 planning',
    'Review on 31 April 2027',
    'Review at 25:99',
    'Review project Apollo 11 and version 3.5',
  ]) {
    const p = parse(text);
    assert.equal(p.understood, false, text);
    assert.equal(p.title, text);
  }
  const p = parse('Read "Every Monday at 9" tomorrow');
  assert.equal(p.title, 'Read "Every Monday at 9"');
  assert.equal(p.repeat, null);
  assert.equal(p.time, null);
  assert.equal(stamp(parse('Check 29 February 2028').date), '2028-02-29');
});
test('calendar selection matches supplied writable calendars and repeat editing stays explicit', () => {
  const p = parse('Review tomorrow; calendar: "Work"', 'event', {
    calendars: [{ id: 'work-id', summary: 'Work' }],
  });
  assert.equal(p.calendarId, 'work-id');
  assert.equal(p.title, 'Review');
  assert.match(parse('Review tomorrow; calendar: "Unknown"').title, /calendar: "Unknown"/);
  assert.equal(parse('Review every Monday', 'event', { allowRepeat: false }).repeat, null);
});
test('all shipped examples remain valid and never produce invalid date or clock fields', () => {
  for (const [kind, examples] of [
    ['event', EVENT_EXAMPLES],
    ['task', TASK_EXAMPLES],
  ])
    for (const text of examples) {
      const p = parse(text, kind);
      assert.ok(p.title, text);
      if (p.date) assert.ok(Number.isFinite(p.date.getTime()), text);
      if (p.time) assert.ok(p.time.hours < 24 && p.time.minutes < 60, text);
    }
});

test('120 reordered field combinations produce the same title, schedule, place and notes', () => {
  const permute = (parts) =>
    parts.length
      ? parts.flatMap((part, index) =>
          permute(parts.filter((_, i) => i !== index)).map((tail) => [part, ...tail]),
        )
      : [[]];
  for (const parts of permute([
    'Planning',
    'tomorrow at 9',
    'for 90 minutes',
    'location: "Office 54"',
    'notes: "Review Friday at 9"',
  ])) {
    const text = parts.join('; '),
      p = parse(text);
    assert.equal(p.title, 'Planning', text);
    assert.equal(stamp(p.date), '2026-10-30', text);
    assert.equal(p.time.hours, 9, text);
    assert.equal(p.durationMinutes, 90, text);
    assert.equal(p.location, 'Office 54', text);
    assert.equal(p.notes, 'Review Friday at 9', text);
  }
});

test('saved form mapping is idempotent, honors manual fields and supports overnight/multi-day events', () => {
  const form = {
    title: '',
    start: '2026-10-29T13:00',
    end: '2026-10-29T14:00',
    description: '',
    location: '',
    allDay: false,
    calendarId: 'primary',
  };
  const p = parse('Deployment tomorrow at 11pm until 1am; notes: Bring ID');
  const once = eventFormFromNatural(form, p),
    twice = eventFormFromNatural(once, p);
  assert.deepEqual(once, twice);
  assert.equal(once.start, '2026-10-30T23:00');
  assert.equal(once.end, '2026-10-31T01:00');
  const manual = eventFormFromNatural(
    { ...form, description: 'Manual notes' },
    p,
    new Set(['description']),
  );
  assert.equal(manual.description, 'Manual notes');
  const bound = eventFormFromNatural(
    form,
    parse('Conference; ends 13 Nov 2026 at 5pm; starts 12 Nov 2026 at 9am'),
  );
  assert.equal(bound.end, '2026-11-13T17:00');
  const task = taskFormFromNatural(
    { title: '', notes: '', due: '', status: 'needsAction' },
    parse('Pay invoice tomorrow; notes: Keep receipt; status: done', 'task'),
  );
  assert.equal(task.due, '2026-10-30');
  assert.equal(task.status, 'completed');
  assert.equal(task.notes, 'Keep receipt');
  assert.equal(parse('Weekly review every monday at 17:00').title, 'Weekly review');
  assert.equal(parse('Look at the revised draft').understood, false);
});

test('unsupported monthly task rules stay intact and edited clock-only events retain their day', () => {
  const p = parse('Budget every last Friday of the month until 31 December 2027', 'task');
  assert.equal(p.date, null);
  assert.equal(p.title, 'Budget every last Friday of the month until 31 December 2027');
  assert.equal(
    stamp(parse('Review at 9', 'event', { defaultDate: '2027-03-10' }).date),
    '2027-03-10',
  );
  assert.ok(parse('Review every Monday for six occurrences until 31 Dec 2027').issues.length);
});

test('legacy day numbers, written clocks and couple-of phrases keep their intended values', () => {
  assert.equal(stamp(parse('Pay rent on 5', 'task').date), '2026-11-05');
  assert.deepEqual(parse("Review tomorrow at nine o'clock").time, { hours: 9, minutes: 0 });
  assert.deepEqual(parse('Review tomorrow at nine thirty in the morning').time, {
    hours: 9,
    minutes: 30,
  });
  assert.equal(stamp(parse('Call in a couple of days', 'task').date), '2026-10-31');
  assert.equal(parse('Review tomorrow at 9 for a couple of hours').durationMinutes, 120);
  const long = 'x'.repeat(21000);
  assert.equal(parse(long).title, long);
});

test('all-day repeat endings use a DATE and timed endings cover the local final day', () => {
  const p = parse('Review every Friday until 31 Dec 2027');
  assert.equal(toRrule(p.repeat, { allDay: true }), 'RRULE:FREQ=WEEKLY;BYDAY=FR;UNTIL=20271231');
});

test('a single AM/PM marker resolves the nearest plausible range on either endpoint', () => {
  assert.equal(parse('Shift tomorrow from 9am to 5').endTime.hours, 17);
  assert.equal(parse('Shift tomorrow from 5pm to 1').endTime.hours, 1);
  assert.equal(parse('Shift tomorrow from 11 to 1am').time.hours, 23);
});
