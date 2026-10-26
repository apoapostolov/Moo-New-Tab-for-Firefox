import { useCallback, useEffect, useRef } from 'react';
import { getBackgroundData, backgroundStamp } from '../api/backgroundLoader';

export function useBackgroundLoader(updateBackground, resetBackground) {
  const isLoadingRef = useRef(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(false);
  const loadRef = useRef(null);

  const loadBackground = useCallback(async () => {
    if (isLoadingRef.current) {
      pendingRef.current = true;
      return;
    }
    isLoadingRef.current = true;

    const stamp = backgroundStamp();
    try {
      // The welcome tab reuses the image stored for it instead of fetching one.
      const welcomeTab = localStorage.getItem('welcomeTab');
      if (welcomeTab) {
        const welcomeImage = localStorage.getItem('welcomeImage');
        if (welcomeImage) {
          if (mountedRef.current && !pendingRef.current) updateBackground(JSON.parse(welcomeImage));
          return;
        }
      }

      const data = await getBackgroundData();
      if (data && stamp === backgroundStamp() && mountedRef.current && !pendingRef.current) {
        updateBackground(data);
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    } finally {
      isLoadingRef.current = false;
      if (pendingRef.current && mountedRef.current) {
        pendingRef.current = false;
        loadRef.current();
      }
    }
  }, [updateBackground]);

  const refreshBackground = useCallback(() => {
    resetBackground();
    loadBackground();
  }, [loadBackground, resetBackground]);

  useEffect(() => {
    mountedRef.current = true;
    loadRef.current = loadBackground;
    const changeMode = localStorage.getItem('backgroundchange');
    const hasStartTime = localStorage.getItem('backgroundStartTime');

    if (!hasStartTime || changeMode === 'refresh') {
      localStorage.setItem('backgroundStartTime', Date.now());
    }

    loadBackground();
    return () => {
      mountedRef.current = false;
      pendingRef.current = false;
    };
  }, [loadBackground]);

  return { loadBackground, refreshBackground };
}
