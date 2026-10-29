import { formatDigits } from 'utils/formatNumber';
export const MAX_WORLD_CLOCKS = 6;
export function validTimezone(zone) {
  if (typeof zone !== 'string' || !zone) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    return Boolean(zone);
  } catch {
    return false;
  }
}
export function readWorldClocks() {
  try {
    const clocks = JSON.parse(localStorage.getItem('worldClocks') || '[]');
    return Array.isArray(clocks)
      ? clocks
          .filter((clock) => clock && typeof clock.label === 'string' && validTimezone(clock.zone))
          .slice(0, MAX_WORLD_CLOCKS)
      : [];
  } catch {
    return [];
  }
}
export function worldClockTime(date, zone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const hour24 = Number(parts.hour);
  const twelve = localStorage.getItem('timeformat') === 'twelvehour';
  const hour = twelve ? hour24 % 12 || 12 : hour24;
  const padded = (n) => String(n).padStart(2, '0').split('').map(formatDigits).join('');
  const hours = localStorage.getItem('zero') === 'true' ? padded(hour) : formatDigits(hour);
  return `${hours}:${padded(Number(parts.minute))}${localStorage.getItem('seconds') === 'true' ? `:${padded(Number(parts.second))}` : ''}${twelve ? (hour24 >= 12 ? ' PM' : ' AM') : ''}`;
}
