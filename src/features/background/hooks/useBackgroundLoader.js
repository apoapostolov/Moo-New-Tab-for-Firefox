import { useCallback, useEffect, useRef } from 'react';
import { getBackgroundData } from '../api/backgroundLoader';

export function useBackgroundLoader(updateBackground, resetBackground) {
  const isLoadingRef = useRef(false);

  const loadBackground = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // The welcome tab reuses the image stored for it instead of fetching one.
      const welcomeTab = localStorage.getItem('welcomeTab');
      if (welcomeTab) {
        const welcomeImage = localStorage.getItem('welcomeImage');
        if (welcomeImage) {
          updateBackground(JSON.parse(welcomeImage));
          return;
        }
      }

      const data = await getBackgroundData();
      if (data) {
        updateBackground(data);
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [updateBackground]);

  const refreshBackground = useCallback(() => {
    resetBackground();
    loadBackground();
  }, [loadBackground, resetBackground]);

  useEffect(() => {
    const changeMode = localStorage.getItem('backgroundchange');
    const hasStartTime = localStorage.getItem('backgroundStartTime');

    if (!hasStartTime || changeMode === 'refresh') {
      localStorage.setItem('backgroundStartTime', Date.now());
    }

    loadBackground();
  }, [loadBackground]);

  return { loadBackground, refreshBackground };
}
