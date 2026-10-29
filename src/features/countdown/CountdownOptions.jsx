import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { Switch } from 'components/Form/Settings';
import { Row, Content, Action, Group } from 'components/Layout/Settings';
import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';

export default function CountdownOptions() {
  useTranslationVersion();
  return (
    <Group>
      <Row>
        <Content
          title={uiText('countdown_widget')}
          subtitle={
            <>
              {uiText('countdown_widget_hint')}
              <br />
              {uiText('countdown_widget_add_hint')}
            </>
          }
        />
        <Action>
          <Switch name="countdownEnabled" category="widgets" stateText />
        </Action>
      </Row>
      <WidgetSurface setting="surfaceCountdown" category="countdown" />
    </Group>
  );
}
