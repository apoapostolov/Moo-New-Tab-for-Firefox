import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { Tooltip } from 'components/Elements';

import EventBus from 'utils/eventbus';
import { getSurface } from 'utils/widgetSurface';
import { isBrandIcon } from 'utils/brandIcons';

import './quicklinks.scss';

import useFocusWorkspace from 'features/focus/useFocusWorkspace';
import { readQuicklinks, quicklinksStorageKey } from './options/utils/quicklinksUtils';

const QuickLinks = memo(() => {
  useTranslationVersion();
  const focused = useFocusWorkspace();
  const storageKey = quicklinksStorageKey(focused);
  const [, redraw] = useState(0);
  const items = readQuicklinks(storageKey);
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
        redraw((value) => value + 1);
        setForceUpdate(Date.now());
      }
    };

    EventBus.on('refresh', handleRefresh);
    const syncStorage = () => redraw((value) => value + 1);
    window.addEventListener('storage', syncStorage);

    setZoom(quicklinksContainer.current);

    return () => {
      EventBus.off('refresh', handleRefresh);
      window.removeEventListener('storage', syncStorage);
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
