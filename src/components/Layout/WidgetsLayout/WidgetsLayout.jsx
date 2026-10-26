import { useTranslationVersion } from 'contexts/TranslationContext';
const WidgetsLayout = ({ children, split = false }) => {
  useTranslationVersion();
  return (
    <div id="widgets" className={split ? 'widgetsSplit' : undefined}>
      {children}
    </div>
  );
};

export { WidgetsLayout as default, WidgetsLayout };
