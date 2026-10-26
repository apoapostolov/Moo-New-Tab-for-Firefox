import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState, memo } from 'react';
import { Checkbox, Slider } from 'components/Form/Settings';
import { Button } from 'components/Elements';
import { toast } from 'react-toastify';

import EventBus from 'utils/eventbus';
import values from 'utils/data/slider_values.json';

import { Row, Content, Action } from 'components/Layout/Settings/Item';

function ExperimentalOptions() {
  useTranslationVersion();
  const [eventType, setEventType] = useState();
  const [eventName, setEventName] = useState();

  return (
    <>
      <span className="mainTitle">
        {variables.getMessage('modals.main.settings.sections.experimental.title')}
      </span>
      <span className="subtitle">
        {variables.getMessage('modals.main.settings.sections.experimental.warning')}
      </span>
      <Row>
        <Content
          title={variables.getMessage('modals.main.settings.sections.experimental.developer')}
        />
        <Action>
          <Checkbox name="debug" text="Debug hotkey (Ctrl + #)" element=".other" />
          <Slider
            title={uiText('debug_timeout_a8866c')}
            name="debugtimeout"
            min="0"
            max="5000"
            default="0"
            step="100"
            marks={values.experimental}
            element=".other"
          />
          <p style={{ textAlign: 'left', width: '100%' }}>{uiText('send_event_b3074e')}</p>
          <div className="text-field">
            <label className="text-field-label">{uiText('type_3deb74')}</label>
            <input
              type="text"
              className="text-field-input"
              value={eventType || ''}
              onChange={(e) => setEventType(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="text-field">
            <label className="text-field-label">{uiText('name_709a23')}</label>
            <input
              type="text"
              className="text-field-input"
              value={eventName || ''}
              onChange={(e) => setEventName(e.target.value)}
              spellCheck={false}
            />
          </div>
          <Button
            type="settings"
            onClick={() => EventBus.emit(eventType, eventName)}
            label={uiText('send_9bc257')}
          />
          <Button
            type="settings"
            onClick={() => toast('Toasted successfully')}
            label={uiText('normal_toast_e23525')}
          />
          <Button
            type="settings"
            onClick={() => toast.success('Toasted successfully')}
            label={uiText('success_toast_da504e')}
          />
        </Action>
      </Row>
      <Row final={true}>
        <Content title={uiText('data_e5e429')} />
        <Action>
          <Button
            type="settings"
            onClick={() => localStorage.clear()}
            label={uiText('clear_localstorage_c451cf')}
          />
        </Action>
      </Row>
    </>
  );
}

const MemoizedExperimentalOptions = memo(ExperimentalOptions);
export {
  MemoizedExperimentalOptions as default,
  MemoizedExperimentalOptions as ExperimentalOptions,
};
