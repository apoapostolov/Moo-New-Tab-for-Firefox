import { useEffect } from 'react';

const HIDDEN_CLASS = 'uiHidden';

/**
 * A triple click is the one gesture the page has no other use for, so it is what hands
 * the page to the video. Only a video background registers it: with a still picture
 * there is nothing to watch on its own, and a hidden page would just look broken.
 */
const onAControl = (target) =>
  Boolean(
    target?.closest?.(
      'input, textarea, select, button, a, [contenteditable="true"], [role="dialog"], .ReactModalPortal',
    ),
  );

export function useCinemaMode(isVideo) {
  useEffect(() => {
    if (!isVideo) return undefined;

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
      // The background changed under a hidden page, so the UI comes back with it.
      document.body.classList.remove(HIDDEN_CLASS);
    };
  }, [isVideo]);
}
