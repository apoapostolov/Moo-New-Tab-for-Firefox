import { WIDGETS, isWidgetEnabled } from 'utils/widgets';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState, useEffect } from 'react';
import { Row, Content, Action } from 'components/Layout/Settings/Item';
import variables from 'config/variables';
import Slider from '../../../Form/Settings/Slider/Slider';

import values from 'utils/data/slider_values.json';
import EventBus from 'utils/eventbus';

const PreferencesWrapper = ({ children, ...props }) => {
  useTranslationVersion();
  const [shown, setShown] = useState(localStorage.getItem(props.setting) === 'true');

  useEffect(() => {
    const toggle = (setting) => {
      if (setting === props.setting) setShown(localStorage.getItem(setting) === 'true');
    };
    EventBus.on('toggle', toggle);
    return () => EventBus.off('toggle', toggle);
  }, [props.setting]);

  const widget = WIDGETS.find((item) => item.setting === props.setting);
  const active = shown || (widget && isWidgetEnabled(widget.id, 'focus'));
  return (
    <div className={active ? 'preferences' : 'preferencesInactive'}>
      {props.zoomSetting && (
        <Row>
          <Content
            title={variables.getMessage(
              'modals.main.settings.sections.appearance.accessibility.widget_zoom',
            )}
            subtitle={variables.getMessage('modals.main.settings.sections.header.size')}
          />
          <Action>
            <Slider
              name={props.zoomSetting}
              min="10"
              max="400"
              default="100"
              display="%"
              marks={values.zoom}
              category={props.zoomCategory || props.category}
            />
          </Action>
        </Row>
      )}
      {children}
    </div>
  );
};

export { PreferencesWrapper as default, PreferencesWrapper };
