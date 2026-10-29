import { uiText } from 'lib/translations';
export const COUNTDOWN_INTERVALS = [1, 60, 300, 900, 3600, 86400];
export const COUNTDOWN_FORMATS = ['human', 'exact', 'seconds'];
export const COUNTDOWN_STYLES = ['value', 'value-progress', 'progress'];
export function validCountdown(value) {
  return Boolean(
    value &&
    typeof value.title === 'string' &&
    value.title.length <= 200 &&
    typeof value.target === 'string' &&
    Number.isFinite(Date.parse(value.target)) &&
    COUNTDOWN_INTERVALS.includes(value.interval) &&
    COUNTDOWN_FORMATS.includes(value.format) &&
    (value.style === undefined || COUNTDOWN_STYLES.includes(value.style)) &&
    (value.startedAt === undefined ||
      (typeof value.startedAt === 'string' && Number.isFinite(Date.parse(value.startedAt)))),
  );
}
export function countdownProgress(value, now = Date.now()) {
  const target = Date.parse(value.target);
  const start = Date.parse(value.startedAt);
  if (!Number.isFinite(target)) return 0;
  if (now >= target) return 1;
  if (!Number.isFinite(start) || target <= start) return 0;
  return Math.max(0, Math.min(1, (now - start) / (target - start)));
}

export function countdownStart(initial, now = Date.now()) {
  return Number.isFinite(Date.parse(initial.startedAt))
    ? initial.startedAt
    : new Date(now).toISOString();
}
export function readCountdownState() {
  try {
    const items = JSON.parse(localStorage.getItem('countdowns') || '[]');
    const valid =
      Array.isArray(items) &&
      items.length <= 100 &&
      items.every(
        (item) =>
          validCountdown(item) && typeof item.id === 'string' && typeof item.text === 'string',
      ) &&
      new Set(items.map((item) => item.id)).size === items.length;
    return { items: valid ? items : [], damaged: !valid };
  } catch {
    return { items: [], damaged: true };
  }
}
export function countdownText(value, now = Date.now(), locale) {
  const delta = Date.parse(value.target) - now;
  if (!Number.isFinite(delta)) return uiText('countdown_choose_date');
  if (value.format === 'human') {
    const abs = Math.abs(delta);
    const [size, unit] =
      abs >= 86400000
        ? [86400000, 'day']
        : abs >= 3600000
          ? [3600000, 'hour']
          : abs >= 60000
            ? [60000, 'minute']
            : [1000, 'second'];
    const n = Math.ceil(abs / size) * Math.sign(delta);
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(n, unit);
  }
  const seconds = Math.max(0, Math.ceil(delta / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  return `${hours}h ${minutes}m${value.format === 'seconds' ? ` ${String(seconds % 60).padStart(2, '0')}s` : ''}`;
}
export function countdownDelay(value, now = Date.now()) {
  const interval = (COUNTDOWN_INTERVALS.includes(value.interval) ? value.interval : 300) * 1000;
  const remaining = Date.parse(value.target) - now;
  return remaining > 0 ? Math.min(interval, remaining) : interval;
}
export function localDateInput(iso) {
  const date = iso ? new Date(iso) : new Date(Date.now() + 86400000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
