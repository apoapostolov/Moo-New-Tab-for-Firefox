import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import EventBus from 'utils/eventbus';
import { getSurface } from 'utils/widgetSurface';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { listCalendars, listEvents, rangeBounds } from './services/calendar';
import { getCalendarSettings, refreshMs } from './settings';
import ConnectPrompt, { describeError } from './components/ConnectPrompt';
import EventDialog from './components/EventDialog';

import './google.scss';

const dayLabel = (value, today, tomorrow) => {
  const date = new Date(value);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

const timeLabel = (event, use24Hour) => {
  if (event.allDay) return 'All day';

  return new Date(event.start).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  });
};

const shortNotes = (value) => {
  const text = value.replace(/\s+/g, ' ').trim();

  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
};

const GoogleCalendar = () => {
  const { auth, loading, error, connectAccount } = useGoogleAuth();
  const [settings, setSettings] = useState(getCalendarSettings);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  // Nothing is drawn until there is something to draw: an empty card that fills in later
  // reads as broken.
  const [ready, setReady] = useState(false);
  const calendarsRef = useRef([]);

  const load = useCallback(async () => {
    const current = getCalendarSettings();
    setSettings(current);
    setBusy(true);
    setFetchError('');

    try {
      const list = calendarsRef.current.length
        ? calendarsRef.current
        : await listCalendars().catch(() => []);

      calendarsRef.current = list;
      setCalendars(list);

      setEvents(
        await listEvents({
          ...rangeBounds(current.rangeDays),
          maxResults: current.maxEvents,
          calendarIds: current.calendarIds,
          calendars: list,
        }),
      );
    } catch (loadError) {
      setFetchError(loadError.message);
    } finally {
      setBusy(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;

    load();

    const timer = setInterval(load, refreshMs(settings.refreshMinutes));

    const onRefresh = (category) => {
      // The settings screen writes the same keys this widget reads.
      if (!category || category === 'google' || category === 'calendar') {
        calendarsRef.current = [];
        load();
      }
    };

    EventBus.on('refresh', onRefresh);

    return () => {
      clearInterval(timer);
      EventBus.off('refresh', onRefresh);
    };
  }, [auth, load, settings.refreshMinutes]);

  const visible = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events
      .filter((event) => (settings.hideAllDay ? !event.allDay : true))
      .filter((event) => (settings.includeDeclined ? true : !event.declined))
      .map((event) => ({ ...event, day: dayLabel(event.start, today, tomorrow) }));
  }, [events, settings.hideAllDay, settings.includeDeclined]);

  const multiCalendar = useMemo(
    () => new Set(visible.map((event) => event.calendarId)).size > 1,
    [visible],
  );

  const onSaved = useCallback((saved) => {
    setEvents((current) => {
      const exists = current.some((event) => event.id === saved.id);

      return exists
        ? current.map((event) => (event.id === saved.id ? saved : event))
        : [...current, saved];
    });
  }, []);

  const onDeleted = useCallback((id) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  }, []);

  if (loading) return null;

  if (!auth) {
    return <ConnectPrompt label="Calendar" onConnect={connectAccount} error={error} />;
  }

  if (!ready) return null;

  const byDay = visible.reduce((groups, event) => {
    const key = new Date(event.start).toDateString();

    groups[key] = groups[key] ?? [];
    groups[key].push(event);

    return groups;
  }, {});

  const item = (event) => (
    <li key={event.id}>
      <button type="button" className="gwItem" onClick={() => setEditing(event)}>
        <span className="gwItemTop">
          <span className="gwItemTitle">
            {multiCalendar && (
              <span
                className="gwDot"
                style={event.calendarColor ? { background: event.calendarColor } : undefined}
              />
            )}
            {event.title}
          </span>
          <span className="gwItemMeta">
            {settings.groupByDay ? '' : `${event.day} · `}
            {timeLabel(event, settings.use24Hour)}
          </span>
        </span>
        {settings.showLocation && event.location && (
          <span className="gwItemSub">{event.location}</span>
        )}
        {settings.showNotes && event.description && (
          <span className="gwItemSub">{shortNotes(event.description)}</span>
        )}
      </button>
    </li>
  );

  return (
    <div className={`googleWidget ${getSurface('calendar')}`}>
      <header className="gwHead">
        <span className="gwLabel">Calendar</span>
        <button
          type="button"
          className="gwIconButton"
          onClick={() => setEditing({})}
          aria-label="New event"
          title="New event"
        >
          +
        </button>
      </header>

      {fetchError && <p className="gwError">{describeError(fetchError)}</p>}

      {!fetchError && !visible.length && (
        <p className="gwEmpty">
          {settings.rangeDays <= 1 ? 'Nothing else today.' : 'Nothing scheduled in this range.'}
        </p>
      )}

      {settings.groupByDay
        ? Object.entries(byDay).map(([day, dayEvents]) => (
            <div className="gwDay" key={day}>
              <span className="gwDayLabel">{dayEvents[0].day}</span>
              <ul className="gwList">{dayEvents.map(item)}</ul>
            </div>
          ))
        : <ul className="gwList">{visible.map(item)}</ul>}

      {editing && (
        <EventDialog
          event={editing.id ? editing : null}
          calendars={calendars}
          defaultCalendarId={settings.calendarIds[0] || calendars[0]?.id || 'primary'}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}

    </div>
  );
};

export default GoogleCalendar;
