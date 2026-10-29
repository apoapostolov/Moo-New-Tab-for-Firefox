import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { useState } from 'react';
import Field from 'components/Form/Field';
import { countdownStart, localDateInput, validCountdown } from './countdownStore';
import 'scss/features.scss';
import 'features/google/google.scss';

function CompactField({ label, multiline, children, ...props }) {
  return (
    <label>
      <span>{label}</span>
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

export default function CountdownForm({ initial = {}, onSave, onCancel, compact = false }) {
  useTranslationVersion();
  const [title, setTitle] = useState(initial.title || '');
  const [target, setTarget] = useState(() => localDateInput(initial.target));
  const [interval, setInterval] = useState(initial.interval || 300);
  const [format, setFormat] = useState(initial.format || 'human');
  const [style, setStyle] = useState(initial.style || 'value');
  const [startedAt, setStartedAt] = useState(() =>
    initial.target && !initial.startedAt && (!initial.style || initial.style === 'value')
      ? undefined
      : countdownStart(initial),
  );
  const [start, setStart] = useState(() => (startedAt ? localDateInput(startedAt) : ''));
  const [text, setText] = useState(initial.text || '');
  const [error, setError] = useState('');
  const FormField = compact ? CompactField : Field;
  const saveAction = (
    <button className={compact ? 'gwButton primary' : 'featureButton'} type="submit">
      {uiText('countdown_save')}
    </button>
  );
  const cancelAction = (
    <button
      className={compact ? 'gwButton' : 'featureButton featureButtonSecondary'}
      type="button"
      onClick={onCancel}
    >
      {uiText('portfolio_cancel')}
    </button>
  );
  const displayOptions = (
    <>
      <FormField
        label={uiText('countdown_update_every')}
        value={interval}
        onChange={(event) => setInterval(Number(event.target.value))}
      >
        {[
          ['1', uiText('interval_second')],
          ['60', uiText('interval_minute')],
          ['300', uiText('interval_five_minutes')],
          ['900', uiText('interval_fifteen_minutes')],
          ['3600', uiText('interval_hour')],
          ['86400', uiText('interval_day')],
        ].map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </FormField>
      <FormField
        label={uiText('countdown_format')}
        value={format}
        onChange={(event) => setFormat(event.target.value)}
      >
        <option value="human">{uiText('countdown_format_human')}</option>
        <option value="exact">{uiText('countdown_format_exact')}</option>
        <option value="seconds">{uiText('countdown_format_seconds')}</option>
      </FormField>
    </>
  );
  return (
    <form
      className={compact ? 'gwForm scratchCountdownForm' : 'featureForm countdownForm'}
      onKeyDown={(event) => {
        if (compact && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const time = new Date(target);
        const targetIso =
          initial.target && target === localDateInput(initial.target)
            ? initial.target
            : Number.isFinite(time.getTime())
              ? time.toISOString()
              : '';
        const value = {
          title: title.trim(),
          target: targetIso,
          interval,
          format,
          style,
          ...(startedAt
            ? {
                startedAt:
                  start === localDateInput(startedAt)
                    ? startedAt
                    : Number.isFinite(Date.parse(start))
                      ? new Date(start).toISOString()
                      : '',
              }
            : {}),
          text,
        };
        if (style !== 'value' && Date.parse(value.startedAt) >= Date.parse(targetIso)) {
          setError({ key: 'countdown_start_invalid' });
          event.currentTarget.elements.namedItem('countdownStart')?.focus();
          return;
        }
        if (!validCountdown(value)) {
          setError({ key: 'countdown_invalid' });
          return;
        }
        try {
          onSave(value);
        } catch (error) {
          setError({ key: 'countdown_save_error', values: { error: error.message } });
        }
      }}
    >
      {compact && (
        <div className="scratchCountdownHeading">
          {uiText(initial.target ? 'countdown_edit' : 'countdown_add')}
        </div>
      )}
      <FormField
        label={`${uiText('field_title')} (${uiText('portfolio_optional')})`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        autoFocus
      />
      {style !== 'value' && (
        <FormField
          label={uiText('countdown_start')}
          name="countdownStart"
          type="datetime-local"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          onInput={(event) => setStart(event.currentTarget.value)}
          aria-invalid={error?.key === 'countdown_start_invalid' || undefined}
          aria-describedby={
            error?.key === 'countdown_start_invalid' ? 'countdownStartError' : undefined
          }
          required
        />
      )}
      <FormField
        label={uiText('countdown_datetime')}
        type="datetime-local"
        value={target}
        onChange={(event) => setTarget(event.target.value)}
        onInput={(event) => setTarget(event.currentTarget.value)}
        required
      />
      {compact ? (
        <div className="gwRow scratchCountdownOptions">{displayOptions}</div>
      ) : (
        displayOptions
      )}
      <FormField
        label={uiText('countdown_style')}
        value={style}
        onChange={(event) => {
          const next = event.target.value;
          if (next !== 'value' && !startedAt) {
            const origin = countdownStart(initial);
            setStartedAt(origin);
            setStart(localDateInput(origin));
          }
          setStyle(next);
        }}
      >
        <option value="value">{uiText('countdown_style_value')}</option>
        <option value="value-progress">{uiText('countdown_style_value_progress')}</option>
        <option value="progress">{uiText('countdown_style_progress')}</option>
      </FormField>
      <FormField
        label={uiText('countdown_notes')}
        multiline
        rows={compact ? 2 : 4}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {error && (
        <p
          id={error.key === 'countdown_start_invalid' ? 'countdownStartError' : undefined}
          className={compact ? 'gwError' : undefined}
          role="alert"
        >
          {uiText(error.key, error.values)}
        </p>
      )}
      <div className={compact ? 'scratchCountdownActions' : 'featureActions'}>
        {compact ? cancelAction : saveAction}
        {compact ? saveAction : cancelAction}
      </div>
    </form>
  );
}
