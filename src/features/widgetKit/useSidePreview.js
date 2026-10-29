import { useLayoutEffect, useState } from 'react';
import { sidePreviewPosition } from './sidePreviewPosition';

export default function useSidePreview(anchor, panelRef, width) {
  const [style, setStyle] = useState({ visibility: 'hidden' });
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const card = anchor?.closest('.widgetCard') || anchor;
    if (!panel || !card) return undefined;

    if (typeof panel.showPopover === 'function') {
      if (!panel.matches(':popover-open')) panel.showPopover();
    } else {
      panel.setAttribute('open', '');
    }
    const measure = () => {
      const next = sidePreviewPosition(
        card.getBoundingClientRect(),
        panel.getBoundingClientRect().height,
        width,
        { width: window.innerWidth, height: window.innerHeight },
      );
      setStyle((previous) =>
        Object.keys(next).every((key) => previous[key] === next[key]) ? previous : next,
      );
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(panel);
    observer?.observe(card);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      if (typeof panel.hidePopover === 'function' && panel.matches(':popover-open')) {
        panel.hidePopover();
      }
    };
  }, [anchor, panelRef, width]);
  return style;
}
