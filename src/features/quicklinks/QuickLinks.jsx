import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { Tooltip } from 'components/Elements';

import EventBus from 'utils/eventbus';
import { getSurface } from 'utils/widgetSurface';
import { isBrandIcon } from 'utils/brandIcons';

import './quicklinks.scss';

// Unparsable stored data falls back to an empty list instead of throwing.
const readQuicklinks = () => {
  try {
    const raw = localStorage.getItem('quicklinks');
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Failed to parse quicklinks from localStorage. Resetting to []', e);
    return [];
  }
};

const QuickLinks = memo(() => {
  useTranslationVersion();
  const [items, setItems] = useState(readQuicklinks());
  const [forceUpdate, setForceUpdate] = useState(0); // Used to force complete re-render
  const quicklinksContainer = useRef(null);

  const setZoom = useCallback((element) => {
    if (!element) return;

    const zoom = localStorage.getItem('zoomQuicklinks') || 100;
    for (const link of element.getElementsByTagName('span')) {
      link.style.fontSize = `${14 * Number(zoom / 100)}px`;
    }

    if (!['text', 'text_only'].includes(localStorage.getItem('quickLinksStyle'))) {
      for (const img of element.getElementsByTagName('img')) {
        img.style.height = `${30 * Number(zoom / 100)}px`;
      }
    }
  }, []);

  useEffect(() => {
    const handleRefresh = (data) => {
      if (data === 'quicklinks') {
        if (localStorage.getItem('quicklinksenabled') === 'false') {
          if (quicklinksContainer.current) {
            quicklinksContainer.current.style.display = 'none';
          }
          return;
        }

        if (quicklinksContainer.current) {
          quicklinksContainer.current.style.display = 'flex';
        }

        setItems(readQuicklinks());
        setForceUpdate(Date.now());
      }
    };

    EventBus.on('refresh', handleRefresh);

    setZoom(quicklinksContainer.current);

    return () => {
      EventBus.off('refresh', handleRefresh);
    };
  }, [setZoom]);

  useEffect(() => {
    setZoom(quicklinksContainer.current);
  }, [items, forceUpdate, setZoom]);

  let target,
    rel = null;
  if (localStorage.getItem('quicklinksnewtab') === 'true') {
    target = '_blank';
    rel = 'noopener noreferrer';
  }

  const tooltipEnabled = localStorage.getItem('quicklinkstooltip');

  const quickLink = (item, index) => {
    if (['text', 'text_only'].includes(localStorage.getItem('quickLinksStyle'))) {
      return (
        <a
          className="quicklinkstext"
          key={`quicklink-${item.key}-${index}`}
          href={item.url}
          target={target}
          rel={rel}
          draggable={false}
        >
          {item.name}
        </a>
      );
    }

    const img =
      item.icon ||
      'https://icon.horse/icon/' + item.url.replace('https://', '').replace('http://', '');
    // Our own marks are black on the wire, so one CSS rule can tint them with the theme.
    const imgClass = isBrandIcon(item.icon) ? 'brandIcon' : undefined;

    if (localStorage.getItem('quickLinksStyle') === 'metro') {
      return (
        <a
          className={`quickLinksMetro ${getSurface('quicklinks')}`}
          key={`quicklink-${item.key}-${index}`}
          href={item.url}
          target={target}
          rel={rel}
          draggable={false}
        >
          <img src={img} alt={item.name} className={imgClass} draggable={false} />
          <span className="subtitle">{item.name}</span>
        </a>
      );
    }

    const link = (
      <a
        key={`quicklink-${item.key}-${index}`}
        href={item.url}
        target={target}
        rel={rel}
        draggable={false}
      >
        <img src={img} alt={item.name} className={imgClass} draggable={false} />
      </a>
    );

    return tooltipEnabled === 'true' ? (
      <Tooltip title={item.name} placement="bottom" key={`quicklink-${item.key}-${index}`}>
        {link}
      </Tooltip>
    ) : (
      link
    );
  };

  return (
    <div className="quicklinkscontainer" ref={quicklinksContainer}>
      {items && items.map((item, index) => quickLink(item, index))}
    </div>
  );
});

QuickLinks.displayName = 'QuickLinks';

export { QuickLinks as default, QuickLinks };
