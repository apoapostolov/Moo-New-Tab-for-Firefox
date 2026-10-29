import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState } from 'react';
import {
  Header,
  Row,
  Content,
  Action,
  Group,
  PreferencesWrapper,
} from 'components/Layout/Settings';
import { Checkbox, Dropdown } from 'components/Form/Settings';

import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';

import { uiText } from 'lib/translations';
import { OptionToggle } from 'features/widgetKit/WidgetKit';
import QuickLinksListEditor from './QuickLinksListEditor';

const QuickLinksOptions = () => {
  useTranslationVersion();
  const [separate, setSeparate] = useState(
    () => localStorage.getItem('quicklinksSeparateFocus') === 'true',
  );
  const QUICKLINKS_SECTION = 'modals.main.settings.sections.quicklinks';

  const AdditionalSettings = () => (
    <Row>
      <Content
        title={variables.getMessage('modals.main.settings.additional_settings')}
        subtitle={variables.getMessage(`${QUICKLINKS_SECTION}.additional`)}
      />
      <Action>
        <Checkbox
          name="quicklinksnewtab"
          text={variables.getMessage(`${QUICKLINKS_SECTION}.open_new`)}
          category="quicklinks"
        />
        <Checkbox
          name="quicklinkstooltip"
          text={variables.getMessage(`${QUICKLINKS_SECTION}.tooltip`)}
          category="quicklinks"
        />
      </Action>
    </Row>
  );

  const StylingOptions = () => (
    <Row>
      <Content
        title={variables.getMessage(`${QUICKLINKS_SECTION}.styling`)}
        subtitle={variables.getMessage(
          'modals.main.settings.sections.quicklinks.styling_description',
        )}
      />
      <Action>
        <Dropdown
          label={variables.getMessage(`${QUICKLINKS_SECTION}.style`)}
          name="quickLinksStyle"
          category="quicklinks"
          items={[
            { value: 'icon', text: variables.getMessage(`${QUICKLINKS_SECTION}.options.icon`) },
            {
              value: 'text_only',
              text: variables.getMessage(`${QUICKLINKS_SECTION}.options.text_only`),
            },
            { value: 'metro', text: variables.getMessage(`${QUICKLINKS_SECTION}.options.metro`) },
          ]}
        />
      </Action>
    </Row>
  );

  return (
    <>
      <Header
        title={variables.getMessage(QUICKLINKS_SECTION + '.title')}
        setting="quicklinksenabled"
        category="quicklinks"
        zoomSetting="zoomQuicklinks"
        visibilityToggle
      />
      <PreferencesWrapper
        setting="quicklinksenabled"
        category="quicklinks"
        visibilityToggle
        zoomSetting="zoomQuicklinks"
      >
        <Group>
          {AdditionalSettings()}
          {StylingOptions()}
          <WidgetSurface setting="surfaceQuicklinks" category="quicklinks" />
        </Group>
      </PreferencesWrapper>
      <OptionToggle
        name="quicklinksSeparateFocus"
        category="quicklinks"
        title={uiText('quicklinks_separate_focus')}
        hint={uiText('quicklinks_separate_focus_hint')}
        onChange={setSeparate}
      />
      <QuickLinksListEditor title={uiText('workspace_standard')} />
      {separate && (
        <QuickLinksListEditor storageKey="focusQuicklinks" title={uiText('workspace_focus_work')} />
      )}
    </>
  );
};
export { QuickLinksOptions as default, QuickLinksOptions };
