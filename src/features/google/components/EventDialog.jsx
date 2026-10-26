import { useRef, useState } from 'react';

import Dialog from './Dialog';
import { useNaturalTitle } from '../useNaturalTitle';
import { describe, toRrule } from '../natural';
import {
  createEvent,
  deleteEvent,
  fromLocalInput,
  toLocalInput,
  updateEvent,
} from '../services/calendar';
import { eventCalendarId, rememberCalendar } from '../settings';
import { examplePlaceholder } from '../examples';

const blankEvent = () => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    title: '',
    description: '',
    location: '',
    start: toLocalInput(start.toISOString()),
    end: toLocalInput(end.toISOString()),
    allDay: false,
    calendarId: '',
  };
};

/**
 * One dialog for create and edit: an event with an id is edited, one without is created.
 * Delete lives here too, since that is where the event is known.
 */
const EventDialog = ({
  event,
  calendars = [],
  defaultCalendarId = 'primary',
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(event?.id);
  const [form, setForm] = useState(() =>
    isEditing
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          start: toLocalInput(event.start),
          end: toLocalInput(event.end),
          allDay: event.allDay,
          calendarId: event.calendarId || defaultCalendarId,
        }
      : { ...blankEvent(), calendarId: eventCalendarId(calendars, defaultCalendarId) },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [repeat, setRepeat] = useState(null);
  // One example per opening, so the title box keeps the same sentence while it is being read.
  const [titlePlaceholder] = useState(() => examplePlaceholder('event'));
  const autoLocation = useRef('');

  /**
   * The title box doubles as the form: a date, clock, length or place typed into it lands in its
   * own field, and whatever no reader claims stays as the title.
   */
  const applyParsed = (parsed) => {
    setRepeat(parsed.repeat || null);

    setForm((current) => {
      const next = { ...current };
      // A re-parsed place replaces the previous one from the sentence, but never a hand-typed
      // location.
      next.location =
        parsed.location || (current.location === autoLocation.current ? '' : current.location);
      autoLocation.current = parsed.location || '';

      if (!parsed.date) return next;

      const day = new Date(parsed.date);

      if (parsed.time) {
        day.setHours(parsed.time.hours, parsed.time.minutes, 0, 0);

        const finish = parsed.endTime
          ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), parsed.endTime.hours, parsed.endTime.minutes)
          : new Date(day.getTime() + (parsed.durationMinutes || 60) * 60000);

        next.allDay = false;
        next.start = toLocalInput(day.toISOString());
        next.end = toLocalInput(finish.toISOString());

        return next;
      }

      next.allDay = true;
      next.start = toLocalInput(day.toISOString());
      next.end = toLocalInput((parsed.endDate ? new Date(parsed.endDate) : day).toISOString());

      return next;
    });
  };

  const parsed = useNaturalTitle(form.title, 'event', applyParsed);

  const update = (key) => (changeEvent) =>
    setForm((current) => ({ ...current, [key]: changeEvent.target.value }));

  // Picking a calendar counts as using it, so the next new event opens on it even before this
  // one is saved.
  const changeCalendar = (changeEvent) => {
    const id = changeEvent.target.value;

    setForm((current) => ({ ...current, calendarId: id }));
    rememberCalendar(id);
  };

  const save = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!form.title.trim()) {
      setError('A title is needed.');

      return;
    }

    setBusy(true);
    setError('');

    const payload = {
      ...form,
      // Trimmed once the reader took the date, clock and place out, so the event is not named
      // "meeting on 24th oct".
      title: (parsed?.title || form.title).trim(),
      recurrence: !isEditing && repeat ? [toRrule(repeat)] : undefined,
      start: form.allDay ? `${form.start.slice(0, 10)}T00:00:00` : fromLocalInput(form.start),
      end: form.allDay ? `${form.end.slice(0, 10)}T00:00:00` : fromLocalInput(form.end),
    };

    try {
      const saved = isEditing
        ? await updateEvent(event.id, payload)
        : await createEvent(payload);

      rememberCalendar(form.calendarId);

      onSaved(saved);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');

    try {
      await deleteEvent(event.id, event.calendarId || defaultCalendarId);
      onDeleted(event.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={isEditing ? 'Edit event' : 'New event'}
      onClose={onClose}
      footer={
        <>
          {isEditing && (
            <button type="button" className="gwButton danger" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <span className="gwSpacer" />
          <button type="button" className="gwButton" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="eventForm" className="gwButton primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="eventForm" className="gwForm" onSubmit={save}>
        {calendars.length > 1 && (
          <label>
            Calendar
            <select value={form.calendarId} onChange={changeCalendar}>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Title
          <input
            value={form.title}
            onChange={update('title')}
            placeholder={titlePlaceholder}
            autoFocus
          />
        </label>

        {parsed && (
          <p className="gwParsedHint">
            {parsed.title && parsed.title !== form.title.trim() && (
              <span className="gwParsedTitle">“{parsed.title}”</span>
            )}
            {parsed.title && parsed.title !== form.title.trim() && ' · '}
            {describe(parsed, 'event')}
            {repeat && isEditing && ' · repeats are only set on new events'}
          </p>
        )}

        <label className="gwInline">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(changeEvent) =>
              setForm((current) => ({ ...current, allDay: changeEvent.target.checked }))
            }
          />
          All day
        </label>

        <div className="gwRow">
          <label>
            Starts
            <input
              type={form.allDay ? 'date' : 'datetime-local'}
              value={form.allDay ? form.start.slice(0, 10) : form.start}
              onChange={update('start')}
            />
          </label>
          <label>
            Ends
            <input
              type={form.allDay ? 'date' : 'datetime-local'}
              value={form.allDay ? form.end.slice(0, 10) : form.end}
              onChange={update('end')}
            />
          </label>
        </div>

        <label>
          Location
          <input value={form.location} onChange={update('location')} placeholder="Optional" />
        </label>

        <label>
          Notes
          <textarea value={form.description} onChange={update('description')} rows={3} />
        </label>

        {error && <p className="gwError">{error}</p>}
      </form>
    </Dialog>
  );
};

export default EventDialog;
