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

import { fetchMixkitVideo } from './api/mixkit';
import { getOfflineImage } from './api/offlineImage';

/* Clips tried after the first one fails. Three Mixkit clips that will not play are enough to
 * conclude the catalogue is not the problem, and an image beats a black page. */
const MIXKIT_RETRIES = 2;

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

  /*
   * The clips that went black on this page, oldest first, and the URLs this component produced
   * itself. A background loaded from anywhere else starts the chain again, so the counter can
   * never drift across page loads.
   */
  const failedClips = useRef([]);
  const produced = useRef(new Set());

  useEffect(() => {
    const url = backgroundData.url;

    if (!url || produced.current.has(url)) return;

    failedClips.current = [];
  }, [backgroundData.url]);

  const handleVideoFail = useCallback(async () => {
    const { url, currentAPI } = backgroundData;

    if (!url) return;

    if (!failedClips.current.includes(url)) failedClips.current.push(url);

    // Mixkit's catalogue is deep enough to be worth another card; a dead clip is not the
    // source's fault.
    if (currentAPI === 'mixkit' && failedClips.current.length <= MIXKIT_RETRIES) {
      const next = await fetchMixkitVideo(failedClips.current);

      if (next?.url) {
        produced.current.add(next.url);
        // Keep the stored record in step with the page: a reload should restore the clip that
        // played, not the one that did not.
        localStorage.setItem('currentBackground', JSON.stringify(next));
        updateBackground(next);

        return;
      }
    }

    // Every other source brings one clip per ask, and a source that ran out of answers leaves
    // the page black. The bundled image is the honest floor.
    updateBackground({ ...getOfflineImage('api'), video: false, hls: false, live: false });
  }, [backgroundData, updateBackground]);

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
          onFail={handleVideoFail}
        />
      ) : (
        <BackgroundImage />
      )}
      <div id="backgroundFilterOverlay" style={overlayFilterStyle} />
    </>
  );
}