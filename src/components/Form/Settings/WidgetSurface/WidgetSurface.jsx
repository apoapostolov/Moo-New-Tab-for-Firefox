import variables from 'config/variables';

import { Dropdown } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';

const SECTION = 'modals.main.settings.surface';

/** The panel style switch. Sections pass their own setting name and refresh category, so a
 * change repaints that widget only; `title` lets one section carry a row per widget. */
function WidgetSurface({ setting, category = 'all', title, subtitle, final }) {
  return (
    <Row final={final}>
      <Content
        title={title ?? variables.getMessage(`${SECTION}.title`)}
        subtitle={subtitle ?? variables.getMessage(`${SECTION}.subtitle`)}
      />
      <Action>
        <Dropdown
          name={setting}
          category={category}
          items={[
            { value: 'classic', text: variables.getMessage(`${SECTION}.classic`) },
            { value: 'glass', text: variables.getMessage(`${SECTION}.glass`) },
          ]}
        />
      </Action>
    </Row>
  );
}

export { WidgetSurface as default, WidgetSurface };
