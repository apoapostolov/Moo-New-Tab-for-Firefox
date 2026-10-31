import { MdAdd, MdDeleteOutline } from 'react-icons/md';
import { uiText } from 'lib/translations';

export default function EventReminders({ value, onChange }) {
  const mode = value.useDefault ? 'default' : value.overrides.length ? 'custom' : 'none';
  const update = (index, patch) =>
    onChange({
      useDefault: false,
      overrides: value.overrides.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  const add = () =>
    onChange({
      useDefault: false,
      overrides: [...value.overrides, { method: 'popup', minutes: 10, _id: crypto.randomUUID() }],
    });
  return (
    <div className="gwReminders">
      <label>
        {uiText('calendar_alerts')}
        <select
          value={mode}
          onChange={(e) =>
            onChange(
              e.target.value === 'default'
                ? { useDefault: true, overrides: [] }
                : {
                    useDefault: false,
                    overrides:
                      e.target.value === 'custom'
                        ? [{ method: 'popup', minutes: 10, _id: crypto.randomUUID() }]
                        : [],
                  },
            )
          }
        >
          <option value="default">{uiText('calendar_alert_default')}</option>
          <option value="custom">{uiText('calendar_alert_custom')}</option>
          <option value="none">{uiText('calendar_alert_none')}</option>
        </select>
      </label>
      {!value.useDefault &&
        value.overrides.map((reminder, index) => (
          <div className="gwReminderRow" key={reminder._id}>
            <label>
              <select
                aria-label={uiText('calendar_alert_method', { n: index + 1 })}
                value={reminder.method}
                onChange={(e) => update(index, { method: e.target.value })}
              >
                <option value="popup">{uiText('calendar_alert_notification')}</option>
                <option value="email">{uiText('calendar_alert_email')}</option>
              </select>
            </label>
            <label>
              <input
                aria-label={uiText('calendar_alert_minutes', { n: index + 1 })}
                type="number"
                min="0"
                max="40320"
                step="1"
                required
                value={reminder.minutes}
                onChange={(e) =>
                  update(index, { minutes: e.target.value === '' ? '' : Number(e.target.value) })
                }
              />
            </label>
            <span className="gwMuted">{uiText('calendar_alert_before')}</span>
            <button
              type="button"
              className="gwIconButton"
              aria-label={uiText('calendar_alert_remove', { n: index + 1 })}
              onClick={() =>
                onChange({
                  useDefault: false,
                  overrides: value.overrides.filter((_, i) => i !== index),
                })
              }
            >
              <MdDeleteOutline />
            </button>
          </div>
        ))}
      {mode === 'custom' && value.overrides.length < 5 && (
        <button type="button" className="gwButton gwReminderAdd" onClick={add}>
          <MdAdd />
          {uiText('calendar_alert_add')}
        </button>
      )}
      <p className="gwMuted">{uiText('calendar_alert_form_hint')}</p>
    </div>
  );
}
