import { useEffect, useId, useRef, useState } from 'react';
import Dialog from 'features/google/components/Dialog';
import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { habitDay, validHabit } from './habitStore';
import '../widgetKit/widgetKit.scss';
import 'features/google/google.scss';

function Field({ label, multiline, children, ...props }) {
  return (
    <label>
      {label}
      {children ? (
        <select {...props}>{children}</select>
      ) : multiline ? (
        <textarea {...props} />
      ) : (
        <input type="text" {...props} />
      )}
    </label>
  );
}

export default function HabitDialog({ initial, onSave, onClose }) {
  const { language } = useTranslationVersion();
  const formId = useId();
  const titleField = useRef(null);
  useEffect(() => {
    titleField.current?.focus();
  }, []);
  const [draft, setDraft] = useState(
    () =>
      initial || {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        frequency: 'daily',
        days: [1, 2, 3, 4, 5],
        target: 1,
        step: 1,
        unit: '',
        startDate: habitDay(),
        archived: false,
        logs: {},
      },
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  return (
    <Dialog
      title={uiText(initial ? 'habits_edit' : 'habits_add')}
      onClose={onClose}
      footer={
        <>
          <span className="gwSpacer" />
          <button type="button" className="gwButton" onClick={onClose}>
            {uiText('portfolio_cancel')}
          </button>
          <button type="submit" form={formId} className="gwButton primary" disabled={saving}>
            {uiText('habits_save')}
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="gwForm"
        onSubmit={async (event) => {
          event.preventDefault();
          const value = {
            ...draft,
            title: draft.title.trim(),
            description: draft.description.trim(),
            unit: '',
            target: draft.frequency === 'weekly' ? Math.min(7, Number(draft.target)) : 1,
            step: 1,
          };
          if (!validHabit(value)) {
            setError(uiText('habits_invalid'));
            return;
          }
          setSaving(true);
          try {
            await onSave(value);
            onClose();
          } catch {
            setError(uiText('widget_save_error'));
            setSaving(false);
          }
        }}
      >
        <Field
          label={uiText('field_title')}
          ref={titleField}
          value={draft.title}
          maxLength={200}
          onChange={(e) => set('title', e.target.value)}
          autoFocus
          required
        />
        <Field
          label={uiText('habits_description')}
          value={draft.description}
          multiline
          rows={2}
          maxLength={2000}
          onChange={(e) => set('description', e.target.value)}
        />
        <Field
          label={uiText('habits_schedule')}
          value={draft.frequency}
          onChange={(e) => set('frequency', e.target.value)}
        >
          {['daily', 'weekdays', 'weekly'].map((value) => (
            <option key={value} value={value}>
              {uiText(`habits_${value}`)}
            </option>
          ))}
        </Field>
        {draft.frequency === 'weekdays' && (
          <fieldset className="wkChecks">
            <legend>{uiText('habits_days')}</legend>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <label key={day}>
                <input
                  type="checkbox"
                  checked={draft.days.includes(day)}
                  onChange={(e) =>
                    set(
                      'days',
                      e.target.checked
                        ? [...draft.days, day]
                        : draft.days.filter((value) => value !== day),
                    )
                  }
                />
                {new Date(Date.UTC(2026, 0, 4 + day)).toLocaleDateString(
                  language.replaceAll('_', '-'),
                  { weekday: 'short', timeZone: 'UTC' },
                )}
              </label>
            ))}
          </fieldset>
        )}
        {draft.frequency === 'weekly' && (
          <Field
            label={uiText('habits_days_per_week')}
            type="number"
            min="1"
            max="7"
            step="1"
            value={Math.min(7, draft.target)}
            required
            onChange={(e) => set('target', e.target.value)}
          />
        )}
        <Field
          label={uiText('habits_start')}
          type="date"
          value={draft.startDate}
          required
          onChange={(e) => set('startDate', e.target.value)}
        />
        {error && (
          <p className="gwError" role="alert">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
