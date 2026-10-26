import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useRef, useState } from 'react';

import Dialog from './Dialog';
import { useNaturalTitle } from '../useNaturalTitle';
import { describe, toRrule } from '../natural';
import {
  createEvent,
  canEditCalendar,
  deleteEvent,
  fromLocalInput,
  toLocalInput,
  toAllDayEndInput,
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
  useTranslationVersion();
  const isEditing = Boolean(event?.id);
  const writableCalendars = calendars.filter(canEditCalendar);
  const readOnly = isEditing && !event.canEdit;
  const [form, setForm] = useState(() =>
    isEditing
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          start: toLocalInput(event.start),
          end: event.allDay ? toAllDayEndInput(event.end) : toLocalInput(event.end),
          allDay: event.allDay,
          calendarId: event.calendarId || defaultCalendarId,
        }
      : {
          ...blankEvent(),
          calendarId: eventCalendarId(
            writableCalendars,
            writableCalendars.find((calendar) => calendar.id === defaultCalendarId)?.id ||
              writableCalendars[0]?.id ||
              '',
          ),
        },
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
          ? new Date(
              day.getFullYear(),
              day.getMonth(),
              day.getDate(),
              parsed.endTime.hours,
              parsed.endTime.minutes,
            )
          : new Date(day.getTime() + (parsed.durationMinutes || 60) * 60000);
        if (finish <= day) finish.setDate(finish.getDate() + 1);

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
    if (readOnly || !writableCalendars.some((calendar) => calendar.id === form.calendarId)) {
      setError('This calendar is read-only. Choose a calendar you can edit.');
      return;
    }

    if (!form.title.trim()) {
      setError('A title is needed.');

      return;
    }
    const start = new Date(form.start);
    const end = new Date(form.end);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      (form.allDay ? end < start : end <= start)
    ) {
      setError(
        'Choose an end after the start. An all-day event can start and end on the same day.',
      );
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
      const saved = isEditing ? await updateEvent(event.id, payload) : await createEvent(payload);

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
    if (readOnly) return;
    setBusy(true);
    setError('');

    try {
      await deleteEvent(event.id, event.calendarId || defaultCalendarId);
      onDeleted(event.id, event.calendarId);
      onClose();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={readOnly ? 'Event details' : isEditing ? 'Edit event' : 'New event'}
      onClose={onClose}
      footer={
        <>
          {isEditing && !readOnly && (
            <button type="button" className="gwButton danger" onClick={remove} disabled={busy}>
              {uiText('delete_f6fdbe')}
            </button>
          )}
          <span className="gwSpacer" />
          <button type="button" className="gwButton" onClick={onClose} disabled={busy}>
            {uiText('cancel_77dfd2')}
          </button>
          <button
            type="submit"
            form="eventForm"
            className="gwButton primary"
            disabled={busy || readOnly || !writableCalendars.length}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="eventForm" className="gwForm" onSubmit={save}>
        {readOnly && <p>{uiText('this_calendar_is_read_only_you_can_view_the_e_efedef')}</p>}
        <fieldset disabled={readOnly || busy} className="gwFields">
          {!isEditing && writableCalendars.length > 1 && (
            <label>
              {uiText('calendar_adab50')}
              <select value={form.calendarId} onChange={changeCalendar}>
                {writableCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            {uiText('title_768e0c')}
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
            {uiText('all_day_114574')}
          </label>

          <div className="gwRow">
            <label>
              {uiText('starts_fc612a')}
              <input
                type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.start.slice(0, 10) : form.start}
                onChange={update('start')}
              />
            </label>
            <label>
              {uiText('ends_91856d')}
              <input
                type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.end.slice(0, 10) : form.end}
                onChange={update('end')}
              />
            </label>
          </div>

          <label>
            {uiText('location_d219c6')}
            <input
              value={form.location}
              onChange={update('location')}
              placeholder={uiText('optional_0c6c41')}
            />
          </label>

          <label>
            {uiText('notes_704400')}
            <textarea value={form.description} onChange={update('description')} rows={3} />
          </label>
        </fieldset>
        {error && (
          <p className="gwError" role="alert">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
};

export default EventDialog;
