import { googleFetch } from '../api';

const EVENTS = (calendarId) => `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
const CALENDAR_LIST = '/calendar/v3/users/me/calendarList';

const toEvent = (event, calendar = {}) => ({
  id: event.id,
  calendarId: calendar.id ?? 'primary',
  calendarName: calendar.summary ?? '',
  calendarColor: calendar.color ?? '',
  title: event.summary || '(no title)',
  description: event.description ?? '',
  location: event.location ?? '',
  // All-day events carry `date` instead of `dateTime`.
  allDay: Boolean(event.start?.date),
  start: event.start?.dateTime ?? event.start?.date ?? '',
  end: event.end?.dateTime ?? event.end?.date ?? '',
  htmlLink: event.htmlLink ?? '',
  declined: Boolean(
    (event.attendees ?? []).some(
      (attendee) => attendee.self && attendee.responseStatus === 'declined',
    ),
  ),
});

/** Every calendar the account can read, for the picker in the settings screen. */
export const listCalendars = async () => {
  const data = await googleFetch(`${CALENDAR_LIST}?minAccessRole=reader&maxResults=250`);

  return (data?.items ?? []).map((calendar) => ({
    id: calendar.id,
    summary: calendar.summaryOverride || calendar.summary || calendar.id,
    color: calendar.backgroundColor ?? '',
    primary: Boolean(calendar.primary),
    accessRole: calendar.accessRole ?? 'reader',
  }));
};

/**
 * The agenda is a union over the calendars switched on, so each is asked separately and the
 * results merge in start order.
 */
export const listEvents = async ({
  timeMin,
  timeMax,
  maxResults = 12,
  calendarIds = [],
  calendars = [],
}) => {
  const ids = calendarIds.length ? calendarIds : ['primary'];
  const known = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  const pages = await Promise.all(
    ids.map(async (id) => {
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        timeMin,
        timeMax,
        maxResults: String(maxResults),
      });

      try {
        const data = await googleFetch(`${EVENTS(id)}?${params}`);

        return (data?.items ?? []).map((event) =>
          toEvent(event, known.get(id) ?? { id, summary: '', color: '' }),
        );
      } catch (error) {
        // One unreadable calendar must not empty the agenda, but the reason still surfaces
        // when every calendar fails.
        return [{ error }];
      }
    }),
  );

  const failed = pages.filter((page) => page[0]?.error);
  const events = pages.filter((page) => !page[0]?.error).flat();

  if (!events.length && failed.length) throw failed[0][0].error;

  return events.sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, maxResults);
};

export const createEvent = async ({
  title,
  description,
  location,
  start,
  end,
  allDay,
  calendarId = 'primary',
  recurrence = [],
}) => {
  const bounds = allDay
    ? { start: { date: start.slice(0, 10) }, end: { date: end.slice(0, 10) } }
    : { start: { dateTime: start }, end: { dateTime: end } };

  const event = await googleFetch(EVENTS(calendarId), {
    method: 'POST',
    body: JSON.stringify({
      summary: title,
      description,
      location,
      ...bounds,
      ...(recurrence.length ? { recurrence } : {}),
    }),
  });

  return toEvent(event, { id: calendarId });
};

export const updateEvent = async (
  id,
  { title, description, location, start, end, allDay, calendarId = 'primary' },
) => {
  const bounds = allDay
    ? { start: { date: start.slice(0, 10) }, end: { date: end.slice(0, 10) } }
    : { start: { dateTime: start }, end: { dateTime: end } };

  const event = await googleFetch(`${EVENTS(calendarId)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ summary: title, description, location, ...bounds }),
  });

  return toEvent(event, { id: calendarId });
};

export const deleteEvent = async (id, calendarId = 'primary') => {
  await googleFetch(`${EVENTS(calendarId)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

/** The window starts at midnight so a day reads as one block, and spans the configured lookahead. */
export const rangeBounds = (days = 7, date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days);

  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
};

/** `datetime-local` wants the local wall clock without a zone suffix. */
export const toLocalInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : '');
