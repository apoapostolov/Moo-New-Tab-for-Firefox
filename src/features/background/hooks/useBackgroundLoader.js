import { useCallback, useEffect, useRef } from 'react';
import { getBackgroundData, backgroundStamp } from '../api/backgroundLoader';

export function useBackgroundLoader(updateBackground, resetBackground) {
  const generation = useRef(0);
  const mountedRef = useRef(false);

  const loadBackground = useCallback(async () => {
    const revision = ++generation.current;
    const stamp = backgroundStamp();
    try {
      // The welcome tab reuses the image stored for it instead of fetching one.
      const welcomeTab = localStorage.getItem('welcomeTab');
      if (welcomeTab) {
        const welcomeImage = localStorage.getItem('welcomeImage');
        if (welcomeImage) {
          if (mountedRef.current && revision === generation.current)
            updateBackground(JSON.parse(welcomeImage));
          return;
        }
      }

      const data = await getBackgroundData();
      if (
        data &&
        stamp === backgroundStamp() &&
        mountedRef.current &&
        revision === generation.current
      ) {
        updateBackground(data);
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  }, [updateBackground]);

  const refreshBackground = useCallback(() => {
    resetBackground();
    loadBackground();
  }, [loadBackground, resetBackground]);

  useEffect(() => {
    mountedRef.current = true;
    const changeMode = localStorage.getItem('backgroundchange');
    const hasStartTime = localStorage.getItem('backgroundStartTime');

    if (!hasStartTime || changeMode === 'refresh') {
      localStorage.setItem('backgroundStartTime', Date.now());
    }

    loadBackground();
    return () => {
      mountedRef.current = false;
      generation.current += 1;
    };
  }, [loadBackground]);

  return { loadBackground, refreshBackground };
}
