import variables from 'config/variables';
import { Checkbox } from 'components/Form/Settings';
import { Text, Dropdown } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';

const DisplaySettings = ({ usingImage }) => {
  return (
    <>
      <Row>
        <Content
          title={variables.getMessage('modals.main.settings.sections.background.display')}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.background.display_subtitle',
          )}
        />
        <Action>
          <Checkbox
            name="bgtransition"
            text={variables.getMessage('modals.main.settings.sections.background.transition')}
            element=".other"
            disabled={!usingImage}
          />
          <Checkbox
            name="bgpanzoom"
            text="Animated background"
            element=".other"
            disabled={!usingImage}
          />
          <Checkbox
            name="backgroundAutoChange"
            text="Auto-change background"
            element=".other"
            disabled={!usingImage}
          />
          <Text
            name="backgroundAutoChangeInterval"
            title="Change interval (minutes)"
            default="60"
            placeholder="60"
          />
        </Action>
      </Row>
      <Row final={true}>
        <Content
          title={variables.getMessage('modals.main.settings.sections.background.information.title')}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.background.information.subtitle',
          )}
        />
        <Action>
          <Checkbox
            name="photoInformation"
            text={variables.getMessage(
              'modals.main.settings.sections.background.photo_information',
            )}
            element=".other"
          />
          <Checkbox
            name="photoInfoRequiresLocation"
            text="Only show info for photos with a location"
            element=".other"
            disabled={!usingImage}
          />
          <Checkbox
            name="photoMap"
            text={variables.getMessage('modals.main.settings.sections.background.show_map')}
            element=".other"
            disabled={!usingImage}
          />
          <Dropdown
            label={variables.getMessage('modals.main.settings.surface.title')}
            name="surfaceBackground"
            category="background"
            items={[
              {
                value: 'classic',
                text: variables.getMessage('modals.main.settings.surface.classic'),
              },
              { value: 'glass', text: variables.getMessage('modals.main.settings.surface.glass') },
            ]}
          />
        </Action>
      </Row>
    </>
  );
};

export default DisplaySettings;