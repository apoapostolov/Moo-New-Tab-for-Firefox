import { useEffect } from 'react';
import EventBus from 'utils/eventbus';
import { desiredBackgroundSource } from '../fallback';
import { getBackgroundFilterStyle, getBackgroundOverlayStyle } from '../api/backgroundFilters';

export function useBackgroundEvents(backgroundData, refreshBackground) {
  useEffect(() => {
    const handleEvent = (event) => {
      if (event === 'background') {
        handleVisibilityToggle();
      } else if (
        ['marketplacebackgrounduninstall', 'backgroundrefresh', 'backgroundsource'].includes(event)
      ) {
        refreshBackground();
      } else if (event === 'backgroundeffect') {
        applyFilters();
      }
    };

    const handleVisibilityToggle = () => {
      const element = document.getElementById(
        backgroundData.video ? 'backgroundVideo' : 'backgroundImage',
      );
      const photoInfo = document.querySelector('.photoInformation');
      const isEnabled = localStorage.getItem('background') !== 'false';

      if (!isEnabled) {
        element?.style.setProperty('display', 'none');
        if (!backgroundData.photoInfo?.hidden) photoInfo?.style.setProperty('display', 'none');
        return;
      }

      element?.style.setProperty('display', 'block');
      if (!backgroundData.photoInfo?.hidden) photoInfo?.style.setProperty('display', 'flex');

      const rawType = localStorage.getItem('backgroundType');
      // API sources are stored as an explicit variant but load as `api`
      const type = [
        'api_mue',
        'api_unsplash',
        'api_coverr',
        'api_mixkit',
        'api_live',
        'api_pixabay',
        'api_pexels',
        'api_nasa',
        'api_commons',
      ].includes(rawType)
        ? 'api'
        : rawType;
      const needsRefresh =
        backgroundData.sourceSelection !== desiredBackgroundSource() ||
        (backgroundData.sourceRole === 'fallback' && desiredBackgroundSource() === 'primary') ||
        (backgroundData.sourceRole !== 'fallback' &&
          ((type !== backgroundData.type &&
            !(backgroundData.photoInfo?.offline && type === backgroundData.type)) ||
            (backgroundData.type === 'api' &&
              localStorage.getItem('backgroundAPI') !== backgroundData.currentAPI) ||
            (type === 'custom' && backgroundData.type !== 'custom') ||
            (backgroundData.photoInfo?.pun &&
              JSON.parse(localStorage.getItem('backgroundExclude') || '[]').includes(
                backgroundData.photoInfo.pun,
              ))));
      if (needsRefresh) refreshBackground();
    };

    const applyFilters = () => {
      if (backgroundData.video) {
        const filter = getBackgroundFilterStyle();
        const element = document.getElementById('backgroundVideo');
        if (element) element.style.webkitFilter = filter;
      } else {
        const overlayElement = document.getElementById('backgroundFilterOverlay');
        if (overlayElement) {
          const overlayStyle = getBackgroundOverlayStyle();
          overlayElement.style.backdropFilter = overlayStyle.backdropFilter;
          overlayElement.style.webkitBackdropFilter = overlayStyle.WebkitBackdropFilter;
          overlayElement.style.backgroundColor = overlayStyle.backgroundColor;
        }
      }
    };

    EventBus.on('refresh', handleEvent);
    return () => EventBus.off('refresh', handleEvent);
  }, [backgroundData, refreshBackground]);
}
