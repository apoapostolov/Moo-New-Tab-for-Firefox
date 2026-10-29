import { googleFetch, googlePages } from '../api';
import { calendarDate } from 'utils/date';
import { authRevision } from '../auth';
import { eventReminders } from '../calendarAlerts';
import { invalidateEventAlerts } from '../alertBridge';

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
export const toEvent = (event, calendar = {}) => ({
  id: event.id,
  calendarId: calendar.id ?? 'primary',
  calendarName: calendar.summary ?? '',
  calendarColor: calendar.color ?? '',
  accessRole: calendar.accessRole ?? 'reader',
  canEdit: canEditCalendar(calendar) && !event.locked,
  title: event.summary || '(no title)',
  description: event.description ?? '',
  location: event.location ?? '',
  // All-day events carry `date` instead of `dateTime`.
  allDay: Boolean(event.start?.date),
  start: event.start?.dateTime ?? event.start?.date ?? '',
  end: event.end?.dateTime ?? event.end?.date ?? '',
  htmlLink: event.htmlLink ?? '',
  timeZone: event.start?.timeZone || event.end?.timeZone || calendar.timeZone || '',
  calendarTimeZone: calendar.timeZone || '',
  defaultReminders: calendar.defaultReminders,
  organizer: event.organizer ?? null,
  creator: event.creator ?? null,
  attendees: event.attendees ?? [],
  attendeesOmitted: Boolean(event.attendeesOmitted),
  recurrence: event.recurrence ?? [],
  recurringEventId: event.recurringEventId || '',
  originalStartTime: event.originalStartTime ?? null,
  reminders: event.reminders ?? { useDefault: true },
  conferenceData: event.conferenceData ?? null,
  hangoutLink: event.hangoutLink || '',
  attachments: event.attachments ?? [],
  status: event.status || 'confirmed',
  visibility: event.visibility || 'default',
  transparency: event.transparency || 'opaque',
  eventType: event.eventType || 'default',
  guestsCanModify: event.guestsCanModify === true,
  guestsCanInviteOthers: event.guestsCanInviteOthers !== false,
  guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests !== false,
  locked: event.locked === true,
  endTimeUnspecified: event.endTimeUnspecified === true,
  created: event.created || '',
  updated: event.updated || '',
  iCalUID: event.iCalUID || '',
  source: event.source ?? null,
  workingLocationProperties: event.workingLocationProperties ?? null,
  outOfOfficeProperties: event.outOfOfficeProperties ?? null,
  focusTimeProperties: event.focusTimeProperties ?? null,
  birthdayProperties: event.birthdayProperties ?? null,
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
    timeZone: calendar.timeZone || '',
    defaultReminders: calendar.defaultReminders,
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
  strict = false,
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
  if (strict && failed.length) throw failed[0][0].error;
  const events = pages.filter((page) => !page[0]?.error).flat();

  if (!events.length && failed.length) throw failed[0][0].error;

  return events
    .filter((event) => (!hideAllDay || !event.allDay) && (includeDeclined || !event.declined))
    .sort((a, b) => calendarDate(a.start) - calendarDate(b.start))
    .slice(0, maxResults);
};

// Private event details stay in memory, scoped to the connected account and revision.
const detailCache = new Map();
const DETAIL_TTL = 5 * 60000;
export const clearEventDetailsCache = () => detailCache.clear();
const readDetail = (key) => {
  const entry = detailCache.get(key);
  if (entry && Date.now() - entry.at < DETAIL_TTL) return entry.value;
  detailCache.delete(key);
  return null;
};
const cacheDetail = (key, value) => {
  detailCache.set(key, { at: Date.now(), value });
  while (detailCache.size > 40) detailCache.delete(detailCache.keys().next().value);
};

/** Expanded instances omit recurrence rules; read their parent without replacing instance data. */
export async function getEventDetails(event, { signal, account = '' } = {}) {
  signal?.throwIfAborted();
  const revision = authRevision();
  const scope = `${account}:${revision}:${event.calendarId}`;
  const context = JSON.stringify([
    event.accessRole,
    event.calendarName,
    event.calendarTimeZone,
    event.defaultReminders,
  ]);
  const key = `${scope}:${event.id}:${event.updated || ''}:${context}`;
  const cached = readDetail(key);
  if (cached) return cached;
  const raw = await googleFetch(`${EVENTS(event.calendarId)}/${encodeURIComponent(event.id)}`, {
    signal,
  });
  let series = null;
  let recurrenceUnavailable = false;
  if (raw.recurringEventId) {
    const parentKey = `${scope}:series:${raw.recurringEventId}`;
    try {
      series =
        readDetail(parentKey) ||
        (await googleFetch(
          `${EVENTS(event.calendarId)}/${encodeURIComponent(raw.recurringEventId)}`,
          { signal },
        ));
      if (revision !== authRevision()) throw new DOMException('Account changed', 'AbortError');
      signal?.throwIfAborted();
      cacheDetail(parentKey, series);
    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted || revision !== authRevision())
        throw error;
      recurrenceUnavailable = true;
    }
  }
  signal?.throwIfAborted();
  if (revision !== authRevision()) throw new DOMException('Account changed', 'AbortError');
  const details = {
    ...toEvent(raw, {
      id: event.calendarId,
      summary: event.calendarName,
      color: event.calendarColor,
      accessRole: event.accessRole,
      timeZone: event.calendarTimeZone,
      defaultReminders: event.defaultReminders,
    }),
    recurrence: series?.recurrence || raw.recurrence || [],
    seriesStart: series?.start || null,
    recurrenceUnavailable,
  };
  cacheDetail(key, details);
  return details;
}

export const createEvent = async ({
  title,
  description,
  location,
  start,
  end,
  allDay,
  calendarId = 'primary',
  recurrence = [],
  reminders = { useDefault:true },
}) => {
  const bounds = eventBounds({ start, end, allDay });
  if (recurrence.length && !allDay) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    bounds.start.timeZone = timeZone;
    bounds.end.timeZone = timeZone;
  }

  const event = await googleFetch(EVENTS(calendarId), {
    method: 'POST',
    body: JSON.stringify({
      summary: title,
      description,
      location,
      ...bounds,
      ...(recurrence.length ? { recurrence } : {}),
      reminders: eventReminders(reminders),
    }),
  });

  return toEvent(event, { id: calendarId, accessRole: 'writer' });
};

export const updateEvent = async (
  id,
  { title, description, location, start, end, allDay, calendarId = 'primary', reminders },
) => {
  const bounds = eventBounds({ start, end, allDay });

  const event = await googleFetch(`${EVENTS(calendarId)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ summary: title, description, location, ...bounds, ...(reminders ? { reminders:eventReminders(reminders) } : {}) }),
  });

  await invalidateEventAlerts(calendarId, id);
  return toEvent(event, { id: calendarId, accessRole: 'writer' });
};

export const deleteEvent = async (id, calendarId = 'primary') => {
  await googleFetch(`${EVENTS(calendarId)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await invalidateEventAlerts(calendarId, id);
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
