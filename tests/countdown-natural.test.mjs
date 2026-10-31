import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCountdown } from '../src/features/countdown/naturalCountdown.js';
const now = new Date(2026, 9, 30, 12, 10);
test('countdowns understand an inclusive deadline and informal ordinal spelling', () => {
  const p = parseCountdown('temu coupons until 31th of oct', now),
    date = new Date(p.target);
  assert.equal(p.title, 'temu coupons');
  assert.deepEqual(p.issues, []);
  assert.equal(date.getMonth(), 9);
  assert.equal(date.getDate(), 31);
  assert.equal(date.getHours(), 23);
  assert.equal(date.getMinutes(), 59);
});
test('countdowns share relative, reordered and explicit clock grammar with events', () => {
  for (const text of ['Launch tomorrow at 5pm', 'Tomorrow at 5pm, Launch']) {
    const p = parseCountdown(text, now),
      date = new Date(p.target);
    assert.equal(p.title, 'Launch');
    assert.equal(date.getDate(), 31);
    assert.equal(date.getHours(), 17);
  }
  const p = parseCountdown('Launch in two hours', now);
  assert.equal(p.title, 'Launch');
  assert.equal(new Date(p.target).getHours(), 14);
  assert.equal(
    new Date(
      parseCountdown('Renewal expires on 15 November 2027 at noon', now).target,
    ).getFullYear(),
    2027,
  );
});
test('quoted text stays literal and unsupported ranges are not silently reduced', () => {
  assert.equal(parseCountdown('"Until tomorrow" on 1 November', now).title, '"Until tomorrow"');
  assert.equal(
    parseCountdown('Holiday from 24 December through 31 December', now).issues.length,
    1,
  );
  assert.equal(parseCountdown('31 February 2027', now), null);
  assert.equal(parseCountdown('A countdown without a date', now), null);
});

const parts = (value) => {
  const date = new Date(value.target);
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
};
test('end-of-day clauses consume their prefix and resolve to 23:59', () => {
  for (const [clause, date] of [
    ['by end of tomorrow', [2026, 10, 31]],
    ['at the end of Friday', [2026, 10, 30]],
    ['before the end of the next Monday', [2026, 11, 2]],
    ['end of day', [2026, 10, 30]],
    ['end of next day', [2026, 10, 31]],
    ['until end of 31st of October', [2026, 10, 31]],
    ['by end of 2026-11-03', [2026, 11, 3]],
    ['end of 03/11/2026', [2026, 11, 3]],
  ]) {
    const p = parseCountdown(`Finish report ${clause}`, now);
    assert.equal(p.title, 'Finish report', clause);
    assert.deepEqual(parts(p), [...date, 23, 59], clause);
  }
});
test('named month endings use the correct final day including leap years', () => {
  for (const [month, expected] of [
    ['February 2027', [2027, 2, 28]],
    ['February 2028', [2028, 2, 29]],
    ['April 2027', [2027, 4, 30]],
    ['October', [2026, 10, 31]],
    ['September', [2027, 9, 30]],
    ['this month', [2026, 10, 31]],
    ['next month', [2026, 11, 30]],
  ]) {
    const p = parseCountdown(`Coupons until the end of ${month}`, now);
    assert.equal(p.title, 'Coupons', month);
    assert.deepEqual(parts(p), [...expected, 23, 59], month);
  }
  const boundary = parseCountdown('Renewal end of next month', new Date(2026, 11, 31, 12));
  assert.deepEqual(parts(boundary), [2027, 1, 31, 23, 59]);
  assert.deepEqual(
    parts(parseCountdown('Renewal end of next month', new Date(2026, 9, 15, 12))),
    [2026, 11, 30, 23, 59],
  );
});
test('year endings support current, next and explicit years without eating quoted title text', () => {
  for (const [clause, year] of [
    ['year', 2026],
    ['this year', 2026],
    ['next year', 2027],
    ['2028', 2028],
    ['year 2028', 2028],
  ]) {
    const p = parseCountdown(`Pay taxes by the end of ${clause}`, now);
    assert.equal(p.title, 'Pay taxes');
    assert.deepEqual(parts(p), [year, 12, 31, 23, 59]);
  }
  assert.equal(
    parseCountdown('"End of year report" by end of November', now).title,
    '"End of year report"',
  );
});
