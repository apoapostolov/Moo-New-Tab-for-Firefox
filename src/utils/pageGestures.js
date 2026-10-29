// Cinema mode accepts up to 700 ms between presses. Note creation waits that long too.
export const MULTICLICK_WINDOW = 700;
export const MULTICLICK_SLOP = 36;

/** Defer a background double-click; any third press in its run cancels it. */
export function deferScratchGesture(document, create, delay = MULTICLICK_WINDOW) {
  let pending;
  let timer;
  const cancel = () => {
    clearTimeout(timer);
    pending = null;
  };
  const press = (event) => {
    if (!pending) return;
    if (
      event.button === 0 &&
      Math.abs(event.clientX - pending.x) <= MULTICLICK_SLOP &&
      Math.abs(event.clientY - pending.y) <= MULTICLICK_SLOP
    )
      cancel();
  };
  document.addEventListener('pointerdown', press, true);
  return {
    schedule(x, y) {
      cancel();
      pending = { x, y };
      timer = setTimeout(() => {
        pending = null;
        create(x, y);
      }, delay);
    },
    dispose() {
      cancel();
      document.removeEventListener('pointerdown', press, true);
    },
  };
}
