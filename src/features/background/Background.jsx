import BackgroundImage from './components/BackgroundImage';
import BackgroundVideo from './components/BackgroundVideo';

import { useBackgroundState } from './hooks/useBackgroundState';
import { setCurrentPhoto } from './photoStore';
import { useBackgroundLoader } from './hooks/useBackgroundLoader';
import { useBackgroundRenderer, useBackgroundFilters, useBackgroundOverlayFilters } from './hooks/useBackgroundRenderer';
import { useBackgroundEvents } from './hooks/useBackgroundEvents';
import { useCinemaMode } from './hooks/useCinemaMode';

import { useEffect, useRef, useCallback } from 'react';
import EventBus from 'utils/eventbus';

import './scss/index.scss';

export default function Background() {
  const { backgroundData, updateBackground, resetBackground } = useBackgroundState();
  const { refreshBackground } = useBackgroundLoader(updateBackground, resetBackground);
  const filterStyle = useBackgroundFilters();
  const overlayFilterStyle = useBackgroundOverlayFilters();

  useBackgroundRenderer(backgroundData);
  useBackgroundEvents(backgroundData, refreshBackground);
  useCinemaMode(backgroundData.video);

  // The credit card is a separate widget, so it needs to know which photo is
  // behind the page without living inside the element that draws it.
  useEffect(() => {
    setCurrentPhoto({
      photoInfo: backgroundData.photoInfo,
      api: backgroundData.currentAPI,
      url: backgroundData.url,
    });
  }, [backgroundData.photoInfo, backgroundData.currentAPI, backgroundData.url]);

  const autoChangeTimerRef = useRef(null);
  const prevSettingsRef = useRef({ enabled: null, mins: null });

  const startAutoChange = useCallback(() => {
    const enabled = localStorage.getItem('backgroundAutoChange') === 'true';
    const mins = Number(localStorage.getItem('backgroundAutoChangeInterval') || 60);
    if (enabled === prevSettingsRef.current.enabled && mins === prevSettingsRef.current.mins) return;
    prevSettingsRef.current = { enabled, mins };
    if (autoChangeTimerRef.current) {
      clearInterval(autoChangeTimerRef.current);
      autoChangeTimerRef.current = null;
    }
    if (!enabled || !mins || mins <= 0) return;
    autoChangeTimerRef.current = setInterval(() => {
      refreshBackground();
    }, mins * 60 * 1000);
  }, [refreshBackground]);

  useEffect(() => {
    const apply = () => {
      const enabled = localStorage.getItem('bgpanzoom') === 'true';
      document.body.classList.toggle('bg-animated', enabled);
    };
    apply();
    const onRefresh = (data) => {
      if (data === 'background' || data === 'bgpanzoom') apply();
      startAutoChange();
    };
    EventBus.on('refresh', onRefresh);
    startAutoChange();
    return () => {
      EventBus.off('refresh', onRefresh);
      if (autoChangeTimerRef.current) clearInterval(autoChangeTimerRef.current);
    };
  }, [startAutoChange]);

  return (
    <>
      {backgroundData.video ? (
        <BackgroundVideo
          url={backgroundData.url}
          filterStyle={filterStyle}
          loop={backgroundData.loop}
          muted={backgroundData.muted}
          hls={backgroundData.hls}
          live={backgroundData.live}
          maxHeight={backgroundData.maxHeight}
        />
      ) : (
        <BackgroundImage />
      )}
      <div id="backgroundFilterOverlay" style={overlayFilterStyle} />
    </>
  );
}