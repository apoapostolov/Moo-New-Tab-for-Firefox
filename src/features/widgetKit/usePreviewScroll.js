import { useEffect } from 'react';

// When two previews briefly overlap, only the most recently opened one owns the wheel.
const readers = [];
const wheelDistance = (event, viewport) =>
  event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport : 1);

/** The Google preview's spring scroll, including when the pointer is still over its card. */
export default function usePreviewScroll(bodyRef, contentKey) {
  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return undefined;
    const reader = {};
    readers.push(reader);
    const motion = { target: 0, position: 0, velocity: 0, frame: 0, last: 0 };
    node.scrollTop = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const tick = (now) => {
      const elapsed = Math.min(0.032, Math.max(0.001, (now - motion.last) / 1000));
      const furthest = Math.max(0, node.scrollHeight - node.clientHeight);
      motion.last = now;
      motion.target = Math.min(furthest, motion.target);
      const acceleration = -220 * (motion.position - motion.target) - 26 * motion.velocity;
      motion.velocity += acceleration * elapsed;
      motion.position += motion.velocity * elapsed;
      if (motion.position < 0 || motion.position > furthest) {
        motion.position = Math.max(0, Math.min(furthest, motion.position));
        motion.velocity = 0;
      }
      node.scrollTop = motion.position;
      if (Math.abs(motion.position - motion.target) < 0.4 && Math.abs(motion.velocity) < 4) {
        node.scrollTop = motion.target;
        motion.velocity = 0;
        motion.frame = 0;
        return;
      }
      motion.frame = window.requestAnimationFrame(tick);
    };
    const onWheel = (event) => {
      if (readers.at(-1) !== reader || !event.deltaY || event.ctrlKey || event.shiftKey) return;
      const furthest = node.scrollHeight - node.clientHeight;
      if (furthest <= 0) return;
      event.preventDefault();
      if (!motion.frame) motion.position = motion.target = node.scrollTop;
      motion.target = Math.max(
        0,
        Math.min(furthest, motion.target + wheelDistance(event, node.clientHeight)),
      );
      if (reduced.matches) {
        node.scrollTop = motion.target;
        return;
      }
      if (!motion.frame) {
        motion.last = window.performance.now();
        motion.frame = window.requestAnimationFrame(tick);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      readers.splice(readers.indexOf(reader), 1);
      window.removeEventListener('wheel', onWheel);
      if (motion.frame) window.cancelAnimationFrame(motion.frame);
    };
  }, [bodyRef, contentKey]);
}
