import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState } from 'react';
import ColorPicker from 'react-best-gradient-color-picker';
import { toast } from 'react-toastify';
import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { MdRefresh } from 'react-icons/md';
import EventBus from 'utils/eventbus';

import '../scss/_colourpicker.scss';

const ColourOptions = ({ setting = 'customBackgroundColour', category = 'background' }) => {
  useTranslationVersion();
  const [colour, setColour] = useState(localStorage.getItem(setting) || 'rgba(0, 0, 0, 100)');

  const changeColour = (output) => {
    setColour(output);
    localStorage.setItem(setting, output);
    EventBus.emit('refresh', category);
  };

  const resetColour = () => {
    setColour('rgba(0, 0, 0, 0)');
    localStorage.setItem(setting, 'rgba(0, 0, 0, 100)');
    toast(variables.getMessage('toasts.reset'));
    EventBus.emit('refresh', category);
  };

  return (
    <Row final={true}>
      <Content
        title={variables.getMessage(
          'modals.main.settings.sections.background.source.custom_colour',
        )}
      />
      <Action>
        <ColorPicker
          value={colour}
          onChange={changeColour}
          hideEyeDrop={true}
          hideColorGuide={true}
          hidePresets={true}
          hideAdvancedSliders={false}
          hideColorTypeBtns={false}
          hideInputType={false}
          height={147}
        />
        <div className="colourReset">
          <span className="link" onClick={() => resetColour()}>
            <MdRefresh />
            {variables.getMessage('modals.main.settings.buttons.reset')}
          </span>
        </div>
      </Action>
    </Row>
  );
};

export { ColourOptions as default, ColourOptions };
