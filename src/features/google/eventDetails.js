import { uiText } from 'lib/translations';
import { calendarDate } from 'utils/date';

export function calendarEventStatus(event, now = Date.now()) {
  if (!event.start || !event.end) return '';
  const start = calendarDate(event.start).getTime();
  const end = calendarDate(event.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || event.endTimeUnspecified)
    return '';
  if (now >= end) return 'passed';
  return now >= start ? 'in_progress' : '';
}

/** Secondary calendars can occupy Google's organizer field; show the known person instead. */
export function eventOrganizer(event, viewer = {}) {
  const calendarAddress = (email) =>
    /@(?:group|resource)\.calendar\.google\.com$/i.test(email || '');
  const sameEmail = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
  let person = event.organizer;
  if (
    person &&
    (calendarAddress(person?.email) ||
      (!person?.email && person?.displayName === event.calendarName))
  ) {
    person =
      event.attendees?.find(
        (attendee) => attendee.organizer && !attendee.resource && !calendarAddress(attendee.email),
      ) || (event.creator && !calendarAddress(event.creator.email) ? event.creator : null);
  }
  if (!person) return null;
  const attendee = event.attendees?.find((guest) => sameEmail(guest.email, person.email));
  const knownName =
    attendee?.displayName ||
    (sameEmail(viewer.email, person.email) ? viewer.name : '') ||
    (sameEmail(event.creator?.email, person.email) ? event.creator.displayName : '');
  return {
    ...person,
    displayName:
      (person.displayName !== event.calendarName && person.displayName) || knownName || '',
  };
}

export function eventUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function eventDate(value, { locale, use24Hour = true, timeZone, allDay = false } = {}) {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? calendarDate(value) : new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(!allDay ? { hour: '2-digit', minute: '2-digit', hour12: !use24Hour } : {}),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && timeZone) {
    try {
      new Intl.DateTimeFormat('en', { timeZone });
      options.timeZone = timeZone;
    } catch {
      /* Use the viewer's timezone when a provider sends an invalid zone. */
    }
  }
  return date.toLocaleString(locale, options);
}

export function eventEnd(event) {
  if (!event.allDay || !event.end) return event.end;
  const end = calendarDate(event.end);
  end.setDate(end.getDate() - 1);
  if (!Number.isFinite(end.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
}

const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const dayName = (code, locale) =>
  new Date(2024, 0, 7 + weekdays.indexOf(code)).toLocaleDateString(locale, { weekday: 'long' });

/** A readable summary plus the exact rule in the UI for advanced recurrence patterns. */
export function recurrenceText(lines = [], { locale, timeZone } = {}) {
  const rule = lines.find((line) => line.startsWith('RRULE:'));
  if (!rule) return lines.length ? uiText('calendar_repeat_custom') : '';
  const parts = Object.fromEntries(
    rule
      .slice(6)
      .split(';')
      .map((part) => part.split('=')),
  );
  const frequencies = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' };
  const frequency = frequencies[parts.FREQ];
  const interval = Number(parts.INTERVAL || 1);
  if (!frequency || !Number.isInteger(interval) || interval < 1)
    return uiText('calendar_repeat_custom');
  const supported = new Set([
    'FREQ',
    'INTERVAL',
    'BYDAY',
    'BYMONTHDAY',
    'BYMONTH',
    'COUNT',
    'UNTIL',
    'WKST',
  ]);
  if (Object.keys(parts).some((key) => !supported.has(key)))
    return uiText('calendar_repeat_custom');
  const result = [
    uiText(interval === 1 ? `calendar_repeat_${frequency}` : `calendar_repeat_${frequency}s`, {
      count: interval,
    }),
  ];
  if (parts.BYDAY) {
    const days = parts.BYDAY.split(',');
    const names = days.map((day) => {
      const match = day.match(/^([1-5]|-1)?(SU|MO|TU|WE|TH|FR|SA)$/);
      if (!match) return null;
      const name = dayName(match[2], locale);
      const position = {
        1: 'first',
        2: 'second',
        3: 'third',
        4: 'fourth',
        5: 'fifth',
        '-1': 'last',
      }[match[1]];
      return position
        ? uiText('calendar_repeat_ordinal', { position: uiText(`calendar_${position}`), day: name })
        : name;
    });
    if (names.some((name) => !name)) return uiText('calendar_repeat_custom');
    result.push(uiText('calendar_repeat_on', { days: names.join(', ') }));
  }
  if (parts.BYMONTHDAY)
    result.push(
      uiText('calendar_repeat_month_days', { days: parts.BYMONTHDAY.split(',').join(', ') }),
    );
  if (parts.BYMONTH) {
    const months = parts.BYMONTH.split(',').map(Number);
    if (!months.every((month) => Number.isInteger(month) && month >= 1 && month <= 12))
      return uiText('calendar_repeat_custom');
    result.push(
      months
        .map((month) => new Date(2024, month - 1, 1).toLocaleDateString(locale, { month: 'long' }))
        .join(', '),
    );
  }
  if (parts.COUNT) result.push(uiText('calendar_repeat_count', { count: parts.COUNT }));
  if (parts.UNTIL) {
    const match = parts.UNTIL.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (match) {
      const date = `${match[1]}-${match[2]}-${match[3]}${match[4] ? `T${match[4]}:${match[5]}:${match[6]}${match[7] || ''}` : ''}`;
      result.push(
        uiText('calendar_repeat_until', {
          date: eventDate(date, { locale, timeZone, allDay: true }),
        }),
      );
    }
  }
  return result.join(' · ');
}

export function reminderText(reminder, locale) {
  const minutes = Number(reminder.minutes);
  const method = uiText(
    reminder.method === 'email' ? 'calendar_reminder_email' : 'calendar_reminder_notification',
  );
  if (!Number.isFinite(minutes) || minutes < 0) return method;
  if (minutes === 0) return uiText('calendar_reminder_at_start', { method });
  const unit = minutes % 1440 === 0 ? 'day' : minutes % 60 === 0 ? 'hour' : 'minute';
  const value = minutes / (unit === 'day' ? 1440 : unit === 'hour' ? 60 : 1);
  return uiText('calendar_reminder_before', {
    method,
    time: new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value),
  });
}
