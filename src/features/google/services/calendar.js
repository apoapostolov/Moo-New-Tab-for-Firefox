import { googleFetch, googlePages } from '../api';
import { calendarDate } from 'utils/date';

const EVENTS = (calendarId) => `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
const CALENDAR_LIST = '/calendar/v3/users/me/calendarList';

export const eventBounds = ({ start, end, allDay }) => {
  if (!allDay) return { start: { dateTime: start }, end: { dateTime: end } };
  const exclusiveEnd = calendarDate(end.slice(0, 10));
  exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
  const pad = (value) => String(value).padStart(2, '0');
  return {
    start: { date: start.slice(0, 10) },
    end: {
      date: `${exclusiveEnd.getFullYear()}-${pad(exclusiveEnd.getMonth() + 1)}-${pad(exclusiveEnd.getDate())}`,
    },
  };
};

export const eventKey = (event) => `${event.calendarId}:${event.id}`;
export const canEditCalendar = (calendar) => ['owner', 'writer'].includes(calendar?.accessRole);
const toEvent = (event, calendar = {}) => ({
  id: event.id,
  calendarId: calendar.id ?? 'primary',
  calendarName: calendar.summary ?? '',
  calendarColor: calendar.color ?? '',
  accessRole: calendar.accessRole ?? 'reader',
  canEdit: canEditCalendar(calendar),
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
export const listCalendars = async (signal) => {
  const items = await googlePages(`${CALENDAR_LIST}?minAccessRole=reader&maxResults=250`, {
    signal,
  });

  return items.map((calendar) => ({
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
  signal,
  timeMin,
  timeMax,
  maxResults = 12,
  calendarIds = [],
  calendars = [],
  hideAllDay = false,
  includeDeclined = false,
}) => {
  const ids = calendarIds.length ? calendarIds : ['primary'];
  const known = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  const pages = await Promise.all(
    ids.map(async (id) => {
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        signal,
        timeMin,
        timeMax,
        maxResults: String(maxResults),
      });

      try {
        const items = await googlePages(`${EVENTS(id)}?${params}`, { signal });

        return items
          .filter((event) => event.status !== 'cancelled')
          .map((event) =>
            toEvent(
              event,
              known.get(id) ??
                (id === 'primary' ? calendars.find((calendar) => calendar.primary) : null) ?? {
                  id,
                  summary: '',
                  color: '',
                },
            ),
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

  return events
    .filter((event) => (!hideAllDay || !event.allDay) && (includeDeclined || !event.declined))
    .sort((a, b) => calendarDate(a.start) - calendarDate(b.start))
    .slice(0, maxResults);
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
  const bounds = eventBounds({ start, end, allDay });

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

  return toEvent(event, { id: calendarId, accessRole: 'writer' });
};

export const updateEvent = async (
  id,
  { title, description, location, start, end, allDay, calendarId = 'primary' },
) => {
  const bounds = eventBounds({ start, end, allDay });

  const event = await googleFetch(`${EVENTS(calendarId)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ summary: title, description, location, ...bounds }),
  });

  return toEvent(event, { id: calendarId, accessRole: 'writer' });
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

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? calendarDate(value) : new Date(value);
  const pad = (number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : '');

export const toAllDayEndInput = (value) => {
  const date = calendarDate(value);
  date.setDate(date.getDate() - 1);
  return toLocalInput(date);
};
