import { useRef } from 'react';
import useScrollThumb from 'utils/useScrollThumb';

export default function WidgetScroll({ children, className = '', enabled = true, id, label }) {
  const ref = useRef(null);

  useScrollThumb(ref, enabled);

  return (
    <div
      ref={ref}
      id={id}
      className={`${className}${enabled ? ' widgetScrollArea' : ''}`}
      role={enabled ? 'region' : undefined}
      aria-label={enabled ? label : undefined}
    >
      {children}
    </div>
  );
}
