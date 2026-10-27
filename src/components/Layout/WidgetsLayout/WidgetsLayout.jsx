import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import WidgetScroll from './WidgetScroll';
const WidgetsLayout = ({ children, split = false, scroll = true }) => {
  useTranslationVersion();
  return (
    <WidgetScroll
      id="widgets"
      className={split ? 'widgetsSplit' : ''}
      enabled={scroll && !split}
      label={uiText('center_widgets_label')}
    >
      {children}
    </WidgetScroll>
  );
};

export { WidgetsLayout as default, WidgetsLayout };
