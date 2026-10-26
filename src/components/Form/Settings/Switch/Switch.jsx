import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { memo, useState, useCallback, useContext } from 'react';
import { RowLabelContext } from 'components/Layout/Settings/Item/SettingsItem';

import EventBus from 'utils/eventbus';

import './Switch.scss';

const Switch = memo((props) => {
  useTranslationVersion();
  const rowLabel = useContext(RowLabelContext);
  const [checked, setChecked] = useState(localStorage.getItem(props.name) === 'true');

  const handleChange = useCallback(() => {
    if (props.disabled) return;
    const value = !checked;
    localStorage.setItem(props.name, value);
    setChecked(value);

    if (props.onChange) {
      props.onChange(value);
    }

    variables.stats.postEvent('setting', `${props.name} ${value ? 'enabled' : 'disabled'}`);

    if (props.element) {
      if (!document.querySelector(props.element)) {
        document.querySelector('.reminder-info').style.display = 'flex';
        return localStorage.setItem('showReminder', true);
      }
    }

    EventBus.emit('refresh', props.category);
  }, [checked, props]);

  return (
    <label className={`switch-wrapper${props.disabled ? ' disabled' : ''}`}>
      {!props.header && <span className="switch-label">{props.text}</span>}
      <input
        type="checkbox"
        name={props.name}
        checked={checked}
        onChange={handleChange}
        className="switch-input"
        aria-label={props.text || props.label || props.name}
        aria-labelledby={rowLabel || undefined}
        disabled={props.disabled || false}
        role="switch"
      />
      <span className={`switch-track ${checked ? 'checked' : ''}`} aria-hidden="true">
        <span className="switch-thumb" />
      </span>
    </label>
  );
});

Switch.displayName = 'Switch';

export { Switch as default, Switch };
