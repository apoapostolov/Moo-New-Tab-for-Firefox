import { parseNatural } from '../google/natural.js';

/** Reuse the calendar's date grammar; date-only deadlines last through the named day. */
export function parseCountdown(text, now = new Date()) {
  const source = String(text || '');
  // Quoted titles are literal, just as in the event and task forms.
  const input = source
    .split(/("[^"]*"|'[^']*')/g)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(/\b(?:until|till|expires?(?:\s+on)?|ending(?:\s+on)?)\s+/gi, 'by '),
    )
    .join('');
  const parsed = parseNatural(input, { now, kind: 'event', allowRepeat: false });
  if (!parsed.date) return null;
  if (
    parsed.endDate ||
    parsed.endTime ||
    parsed.repeat ||
    parsed.durationMinutes ||
    parsed.location
  )
    return { issues: ['countdown_natural_single_deadline'] };
  const target = new Date(parsed.date);
  target.setHours(parsed.time?.hours ?? 23, parsed.time?.minutes ?? 59, 0, 0);
  return {
    title: parsed.title,
    target: target.toISOString(),
    text: parsed.notes,
    issues: parsed.issues.length ? ['countdown_natural_single_deadline'] : [],
  };
}
