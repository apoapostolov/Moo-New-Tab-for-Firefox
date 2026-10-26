/**
 * Day of the month with its ordinal suffix: 1 becomes `1st`.
 */
export function nth(d) {
  if (d > 3 && d < 21) {
    return d + 'th';
  }

  switch (d % 10) {
    case 1:
      return d + 'st';
    case 2:
      return d + 'nd';
    case 3:
      return d + 'rd';
    default:
      return d + 'th';
  }
}

/**
 * Shifts a date's wall-clock time to `tz` by re-parsing a localised string, so
 * the returned Date's own offset no longer describes `tz`.
 */
export function convertTimezone(date, tz) {
  return new Date(
    (typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', {
      timeZone: tz,
    }),
  );
}
