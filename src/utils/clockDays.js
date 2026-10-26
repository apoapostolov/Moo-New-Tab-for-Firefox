/**
 * Progress only answers for the days stored in `percentageDays`; the rest fall
 * back to `percentageOffType`. Values are `Date#getDay` values, so 0 is Sunday.
 */
export const WEEKDAYS = [
  { value: 1, label: 'MON' },
  { value: 2, label: 'TUE' },
  { value: 3, label: 'WED' },
  { value: 4, label: 'THU' },
  { value: 5, label: 'FRI' },
  { value: 6, label: 'SAT' },
  { value: 0, label: 'SUN' },
];

// Mon–Fri.
export const DEFAULT_PERCENTAGE_DAYS = [1, 2, 3, 4, 5];

export function readPercentageDays() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem('percentageDays'));
  } catch {
    stored = null;
  }

  if (!Array.isArray(stored)) return DEFAULT_PERCENTAGE_DAYS;

  return stored.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function savePercentageDays(days) {
  localStorage.setItem('percentageDays', JSON.stringify(days));
}

export function isPercentageDay(date = new Date()) {
  return readPercentageDays().includes(date.getDay());
}

/**
 * Whether `percentageDays` restricts Progress at all. Defaults to on.
 */
export function readPercentageFallback() {
  return localStorage.getItem('percentageFallback') !== 'false';
}

/**
 * The clock used on days Progress does not cover. Progress is never returned:
 * it is the clock being replaced.
 */
export function offClockType() {
  const stored = localStorage.getItem('percentageOffType');

  return stored && stored !== 'percentageComplete' ? stored : 'digital';
}

/**
 * The clock type to render, after the day restriction is applied.
 */
export function resolveTimeType() {
  const stored = localStorage.getItem('timeType');

  if (stored === 'percentageComplete' && readPercentageFallback() && !isPercentageDay()) {
    return offClockType();
  }

  return stored;
}
