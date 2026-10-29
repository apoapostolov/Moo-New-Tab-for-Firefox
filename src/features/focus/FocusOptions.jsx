import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { useState } from 'react';
import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';
import { Dropdown, Switch } from 'components/Form/Settings';
import Field from 'components/Form/Field';
import EventBus from 'utils/eventbus';

function Duration({ name, label, fallback, max = 240 }) {
  const [value, setValue] = useState(() => localStorage.getItem(name) || String(fallback));
  return (
    <Field
      label={label}
      type="number"
      min="1"
      max={max}
      step="1"
      value={value}
      onChange={(event) => {
        const text = event.target.value;
        setValue(text);
        if (Number.isInteger(Number(text)) && Number(text) >= 1 && Number(text) <= max) {
          localStorage.setItem(name, text);
          EventBus.emit('refresh', 'focus');
        }
      }}
      onBlur={() => setValue(localStorage.getItem(name) || String(fallback))}
    />
  );
}
export default function FocusOptions() {
  useTranslationVersion();
  const [mode, setMode] = useState(() => localStorage.getItem('focusMode') || 'focus');
  return (
    <>
      <Header title={uiText('focus_title')} />
      <Group>
        <Row>
          <Content title={uiText('focus_action')} subtitle={uiText('focus_action_hint')} />
          <Action>
            <Dropdown
              name="focusMode"
              category="focus"
              onChange={setMode}
              items={[
                { value: 'focus', text: uiText('focus_title') },
                { value: 'pomodoro', text: uiText('focus_pomodoro') },
              ]}
            />
          </Action>
        </Row>
        <Row final>
          <Content title={uiText('fallback_background')} subtitle={uiText('focus_fallback_hint')} />
          <Action>
            <Switch
              name="focusFallbackBackground"
              stateText
              label={uiText('fallback_background')}
              category="focus"
            />
          </Action>
        </Row>
      </Group>
      {mode === 'pomodoro' && (
        <Group>
          <Row>
            <Content title={uiText('focus_schedule')} subtitle={uiText('focus_schedule_hint')} />
          </Row>
          <Row final>
            <div className="featureForm">
              <Duration name="pomodoroWork" label={uiText('focus_work_minutes')} fallback={25} />
              <Duration
                name="pomodoroBreak"
                label={uiText('focus_short_break_minutes')}
                fallback={5}
              />
              <Duration
                name="pomodoroLongBreak"
                label={uiText('focus_long_break_minutes')}
                fallback={15}
              />
              <Duration
                name="pomodoroRounds"
                label={uiText('focus_rounds')}
                fallback={4}
                max={12}
              />
            </div>
          </Row>
        </Group>
      )}
    </>
  );
}
