import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';

import { Switch } from 'components/Form/Settings';
import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';

const MiscOptions = () => {
  useTranslationVersion();
  const MISC_SECTION = 'modals.main.settings.sections.misc';

  return (
    <>
      <Header title={variables.getMessage(`${MISC_SECTION}.title`)} />

      <Group>
        <Row>
          <Content
            title={variables.getMessage(`${MISC_SECTION}.cinema.title`)}
            subtitle={variables.getMessage(`${MISC_SECTION}.cinema.subtitle`)}
          />
          <Action>
            <Switch name="cinemaMode" category="other" stateText />
          </Action>
        </Row>
      </Group>
    </>
  );
};

export { MiscOptions as default, MiscOptions };
