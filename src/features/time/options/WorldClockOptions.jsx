import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { useState } from 'react';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';
import { Row, Content, Action, Group } from 'components/Layout/Settings';
import { Dropdown } from 'components/Form/Settings';
import Field from 'components/Form/Field';
import EventBus from 'utils/eventbus';
import { readWorldClocks, MAX_WORLD_CLOCKS, validTimezone } from '../worldClockStore';
import './worldClockOptions.scss';

export default function WorldClockOptions() {
  useTranslationVersion();
  const [clocks, setClocks] = useState(readWorldClocks);
  const [label, setLabel] = useState('');
  const [zone, setZone] = useState('Europe/London');
  const [error, setError] = useState('');
  const zones = Intl.supportedValuesOf('timeZone');
  const commit = (next) => {
    localStorage.setItem('worldClocks', JSON.stringify(next));
    setClocks(next);
    EventBus.emit('refresh', 'clock');
  };
  return (
    <Group>
      <Row>
        <Content title={uiText('world_clocks')} subtitle={uiText('world_clocks_hint')} />
        <Action>
          <Dropdown
            name="worldClockLayout"
            category="clock"
            items={[
              { value: 'row', text: uiText('world_clocks_separate') },
              { value: 'inline', text: uiText('world_clocks_inline') },
            ]}
          />
        </Action>
      </Row>
      {clocks.map((clock) => (
        <Row key={clock.id}>
          <div className="worldClockOptionRow">
            <span className="worldClockOptionName" title={clock.label}>
              {clock.label}
            </span>
            <span className="worldClockOptionZone" title={clock.zone}>
              {clock.zone.replaceAll('_', ' ')}
            </span>
            <button
              className="worldClockOptionGlyph"
              type="button"
              title={uiText('remove_named', { name: clock.label })}
              aria-label={uiText('remove_named', { name: clock.label })}
              onClick={() => {
                commit(clocks.filter((item) => item.id !== clock.id));
                setError('');
              }}
            >
              <MdDeleteOutline aria-hidden="true" />
            </button>
          </div>
        </Row>
      ))}
      <Row final>
        <form
          className="worldClockOptionForm"
          onSubmit={(event) => {
            event.preventDefault();
            if (!validTimezone(zone) || clocks.length >= MAX_WORLD_CLOCKS) {
              setError('world_clocks_invalid');
              return;
            }
            commit([
              ...clocks,
              {
                id: crypto.randomUUID(),
                label: label.trim() || zone.split('/').pop().replaceAll('_', ' '),
                zone,
              },
            ]);
            setLabel('');
            setError('');
          }}
        >
          <div className="worldClockOptionRow">
            <Field
              label={uiText('world_clocks_location')}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={60}
              placeholder={uiText('london_4c57f0')}
            />
            <Field
              label={uiText('world_clocks_zone')}
              value={zone}
              onChange={(event) => setZone(event.target.value)}
            >
              {zones.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll('_', ' ')}
                </option>
              ))}
            </Field>
            <button
              className="worldClockOptionGlyph"
              type="submit"
              title={uiText('world_clocks_add')}
              aria-label={uiText('world_clocks_add')}
              disabled={clocks.length >= MAX_WORLD_CLOCKS}
            >
              <MdAdd aria-hidden="true" />
            </button>
          </div>
          {error && <p role="alert">{uiText(error)}</p>}
        </form>
      </Row>
    </Group>
  );
}
