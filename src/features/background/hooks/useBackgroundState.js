import { useState, useCallback } from 'react';

export function useBackgroundState() {
  const [backgroundData, setBackgroundData] = useState({
    url: '',
    style: '',
    type: '',
    currentAPI: '',
    video: false,
    photoInfo: {
      hidden: false,
      offline: false,
      photographerURL: '',
      photoURL: '',
    },
  });

  const updateBackground = useCallback((newData) => {
    setBackgroundData({
      url: '',
      style: '',
      type: '',
      currentAPI: '',
      video: false,
      hls: false,
      live: false,
      loop: undefined,
      muted: undefined,
      ...newData,
      photoInfo: {
        hidden: false,
        offline: false,
        ...(newData.photoInfo || {}),
      },
    });
  }, []);

  const resetBackground = useCallback(() => {
    setBackgroundData({
      url: '',
      style: '',
      type: '',
      currentAPI: '',
      video: false,
      photoInfo: { hidden: true },
    });
  }, []);

  return {
    backgroundData,
    updateBackground,
    resetBackground,
  };
}
