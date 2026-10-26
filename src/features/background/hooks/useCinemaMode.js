import { useEffect, useState } from 'react';
import EventBus from 'utils/eventbus';

const HIDDEN_CLASS = 'uiHidden';
const SETTING = 'cinemaMode';

/* The gesture's own tolerances, not the browser's. A click run is counted per element and
 * expires on the double-click interval: on a page built out of stacked cards, notes and
 * text, two of the three presses land on different elements and the run never reaches
 * three, which is why the gesture felt unreliable rather than rare. */
const TAPS = 3;
const TAP_WINDOW = 700; // ms between presses — slower than the system's double-click gap
const TAP_SLOP = 36; // px a hand may wander between presses and still mean the same run
const RESTORE_DELAY = 300; // ms the page ignores presses for, so the reaching press cannot undo itself

/**
 * A triple press is the one gesture the page has no other use for, so it is what hands the
 * page to the video. Only a video background registers it: with a still picture there is
 * nothing to watch on its own, and a hidden page would just look broken.
 *
 * With the UI hidden there is nothing left to click, so a single press brings it back.
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

    let taps = 0;
    let lastAt = 0;
    let lastX = 0;
    let lastY = 0;
    let hiddenAt = 0;

    const press = (event) => {
      // A secondary button or a second finger is a different intention, not a faster run.
      if (event.button !== 0 || event.isPrimary === false) {
        taps = 0;
        return;
      }

      // Controls keep their clicks: pressing a widget three times is still pressing a widget.
      if (onAControl(event.target)) {
        taps = 0;
        return;
      }

      const now = event.timeStamp || performance.now();

      if (document.body.classList.contains(HIDDEN_CLASS)) {
        if (now - hiddenAt < RESTORE_DELAY) return;
        document.body.classList.remove(HIDDEN_CLASS);
        taps = 0;
        return;
      }

      const quick = now - lastAt <= TAP_WINDOW;
      const near =
        Math.abs(event.clientX - lastX) <= TAP_SLOP && Math.abs(event.clientY - lastY) <= TAP_SLOP;

      taps = quick && near ? taps + 1 : 1;
      lastAt = now;
      lastX = event.clientX;
      lastY = event.clientY;

      if (taps < TAPS) return;

      taps = 0;
      hiddenAt = now;

      // Left alone, the browser's own triple click selects the paragraph it lands in, and
      // the selection would still be there when the page comes back.
      event.preventDefault();
      document.body.classList.add(HIDDEN_CLASS);
    };

    // Nothing else is on screen to escape with, so the keyboard has to reach it too.
    const handleKey = (event) => {
      if (event.key === 'Escape' && document.body.classList.contains(HIDDEN_CLASS)) {
        document.body.classList.remove(HIDDEN_CLASS);
      }
    };

    // Captured, so an element that stops propagation cannot keep the gesture from arriving.
    document.addEventListener('pointerdown', press, true);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('pointerdown', press, true);
      document.removeEventListener('keydown', handleKey);
      // The background or the switch changed under a hidden page, so the UI comes back.
      document.body.classList.remove(HIDDEN_CLASS);
    };
  }, [isVideo, enabled]);
}
