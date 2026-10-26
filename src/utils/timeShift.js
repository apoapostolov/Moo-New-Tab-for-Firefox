const MINUTES_IN_DAY = 24 * 60;

/**
 * Minutes since midnight from `9`, `9:30`, `9am` or `17:00`; null if the text
 * means nothing, so a typo falls back rather than drawing a guess.
 */
export function parseClockInput(raw) {
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim().toLowerCase().replace(/\s+/g, '');

  if (!text) return null;

  const match = text.match(/^(\d{1,2})(?:[:.](\d{2}))?(am|pm|a|p)?$/);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const suffix = match[3];

  if (minutes > 59) return null;

  if (suffix) {
    if (hours < 1 || hours > 12) return null;

    const isPm = suffix.startsWith('p');

    if (hours === 12) hours = isPm ? 12 : 0;
    else if (isPm) hours += 12;
  } else if (hours > 24 || (hours === 24 && minutes > 0)) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Window in minutes since midnight. Either field may be empty, and an end
 * before the start runs past midnight.
 */
export function shiftWindow(startRaw, endRaw) {
  const start = parseClockInput(startRaw);
  const end = parseClockInput(endRaw);
  const from = start === null ? 0 : start;
  let to = end === null ? MINUTES_IN_DAY : end;

  if (to <= from) to += MINUTES_IN_DAY;

  return { from, to };
}

/**
 * Where `now` falls in the window, before clamping. When the window runs past
 * midnight the morning hours are lifted into it, and the shift is dated to the
 * day it began rather than the day the clock happens to be reading.
 */
function positionInWindow(now, startRaw, endRaw) {
  const { from, to } = shiftWindow(startRaw, endRaw);
  let minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let shiftDay = now.getDay();

  if (to > MINUTES_IN_DAY && minutes < to - MINUTES_IN_DAY) {
    minutes += MINUTES_IN_DAY;
    shiftDay = (shiftDay + 6) % 7;
  }

  return { from, to, minutes, shiftDay, fraction: (minutes - from) / (to - from) };
}

/**
 * Fraction of the shift elapsed, clamped to 0–1. A window outside the shift still
 * answers 0 or 1 here; `shiftPosition` is the one that says whether the shift is
 * running at all.
 */
export function shiftFraction(now, startRaw, endRaw) {
  const { fraction } = positionInWindow(now, startRaw, endRaw);

  return Math.min(1, Math.max(0, fraction));
}

/**
 * `{ fraction, shiftDay }` while the shift is running, or null before the start and
 * after the end. `shiftDay` is the weekday the shift belongs to.
 */
export function shiftPosition(now, startRaw, endRaw) {
  const { from, to, minutes, shiftDay, fraction } = positionInWindow(now, startRaw, endRaw);

  if (minutes < from || minutes > to) return null;

  return { fraction: Math.min(1, Math.max(0, fraction)), shiftDay };
}
