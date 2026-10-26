import { useEffect, useState } from 'react';
import EventBus from 'utils/eventbus';

const HIDDEN_CLASS = 'uiHidden';
const SETTING = 'cinemaMode';

/**
 * A triple click is the one gesture the page has no other use for, so it is what hands
 * the page to the video. Only a video background registers it: with a still picture
 * there is nothing to watch on its own, and a hidden page would just look broken.
 *
 * The switch defaults to on, so a profile that has never touched it has the gesture;
 * only an explicit false takes it away.
 */
export const readCinemaMode = () => localStorage.getItem(SETTING) !== 'false';

const onAControl = (target) =>
  Boolean(
    target?.closest?.(
      'input, textarea, select, button, a, [contenteditable="true"], [role="dialog"], .ReactModalPortal',
    ),
  );

export function useCinemaMode(isVideo) {
  const [enabled, setEnabled] = useState(readCinemaMode);

  // Switched off from the settings panel with the page already open: the handler has to
  // go, and so does the state if it was hiding anything.
  useEffect(() => {
    const reread = () => setEnabled(readCinemaMode());

    EventBus.on('refresh', reread);

    return () => EventBus.off('refresh', reread);
  }, []);

  useEffect(() => {
    if (!isVideo || !enabled) return undefined;

    const handleClick = (event) => {
      // The browser counts the clicks in a run, so the third one is the gesture.
      if (event.detail !== 3 || onAControl(event.target)) return;

      document.body.classList.toggle(HIDDEN_CLASS);
    };

    // Nothing else is on screen to escape with, so the keyboard has to reach it too.
    const handleKey = (event) => {
      if (event.key === 'Escape' && document.body.classList.contains(HIDDEN_CLASS)) {
        document.body.classList.remove(HIDDEN_CLASS);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
      // The background or the switch changed under a hidden page, so the UI comes back.
      document.body.classList.remove(HIDDEN_CLASS);
    };
  }, [isVideo, enabled]);
}
