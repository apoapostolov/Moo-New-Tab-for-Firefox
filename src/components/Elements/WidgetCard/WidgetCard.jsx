import { useTranslationVersion } from 'contexts/TranslationContext';
import { createElement } from 'react';
import { getSurface } from 'utils/widgetSurface';
export default function WidgetCard({ as = 'div', widget, className = '', children, ...props }) {
  useTranslationVersion();
  return createElement(
    as,
    { ...props, className: `widgetCard ${className} ${getSurface(widget)}` },
    children,
  );
}
export function WidgetHeader({ children, className = '' }) {
  useTranslationVersion();
  return <header className={`widgetHeader ${className}`}>{children}</header>;
}
