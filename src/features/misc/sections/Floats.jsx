import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { Switch } from 'components/Form/Settings';
import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';
import CountdownOptions from 'features/countdown/CountdownOptions';

const CONTROLS = [
  { key: 'notes', setting: 'scratchNotes' },
  { key: 'images', setting: 'scratchImages' },
  { key: 'no_tilt', setting: 'scratchNoTilt' },
  { key: 'transparent', setting: 'scratchNotesBare' },
];

export function FloatsOptions() {
  useTranslationVersion();
  const section = 'modals.main.settings.sections.floats';
  return (
    <>
      <Header title={variables.getMessage(`${section}.title`)} />
      <Group>
        {CONTROLS.map(({ key, setting }) => (
          <Row key={key}>
            <Content
              title={variables.getMessage(`${section}.${key}.title`)}
              subtitle={variables.getMessage(`${section}.${key}.subtitle`)}
            />
            <Action>
              <Switch name={setting} category="other" stateText />
            </Action>
          </Row>
        ))}
      </Group>
      <CountdownOptions />
    </>
  );
}
