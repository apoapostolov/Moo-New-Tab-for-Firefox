import { useEffect, useRef } from 'react';

const IDLE_MS = 900;
const WIDTH = 6;

export default function WidgetScroll({ children, className = '', enabled = true, id, label }) {
  const ref = useRef(null);

  useEffect(() => {
    const target = ref.current;
    if (!enabled || !target) return undefined;

    const thumb = document.createElement('div');
    thumb.className = 'widgetScrollThumb';
    thumb.setAttribute('aria-hidden', 'true');
    document.body.append(thumb);
    let timer;
    let frame;
    let drag;

    const position = () => {
      frame = null;
      const overflow = target.scrollHeight - target.clientHeight;
      target.tabIndex = overflow > 1 ? 0 : -1;
      if (overflow <= 1) {
        thumb.classList.remove('is-on');
        return;
      }
      const rect = target.getBoundingClientRect();
      const height = Math.min(
        rect.height,
        Math.max(24, (target.clientHeight / target.scrollHeight) * rect.height),
      );
      const top = rect.top + (target.scrollTop / overflow) * (rect.height - height);
      Object.assign(thumb.style, {
        left: `${Math.round(Math.min(window.innerWidth - WIDTH - 1, rect.right + 3))}px`,
        top: `${Math.round(top)}px`,
        height: `${Math.round(height)}px`,
      });
    };
    const schedulePosition = () => {
      if (!frame) frame = requestAnimationFrame(position);
    };
    const fade = () => {
      clearTimeout(timer);
      if (!drag) timer = setTimeout(() => thumb.classList.remove('is-on'), IDLE_MS);
    };
    const scroll = () => {
      if (target.scrollHeight <= target.clientHeight + 1) return;
      position();
      thumb.classList.add('is-on');
      fade();
    };
    const down = (event) => {
      if (event.button !== 0 || !thumb.classList.contains('is-on')) return;
      const overflow = target.scrollHeight - target.clientHeight;
      const travel = target.getBoundingClientRect().height - thumb.getBoundingClientRect().height;
      if (overflow <= 0 || travel <= 0) return;
      event.preventDefault();
      thumb.setPointerCapture(event.pointerId);
      drag = {
        pointerId: event.pointerId,
        y: event.clientY,
        top: target.scrollTop,
        overflow,
        travel,
      };
      thumb.classList.add('is-dragging');
      clearTimeout(timer);
    };
    const move = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      target.scrollTop = Math.max(
        0,
        Math.min(
          drag.overflow,
          drag.top + ((event.clientY - drag.y) / drag.travel) * drag.overflow,
        ),
      );
    };
    const up = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag = null;
      thumb.classList.remove('is-dragging');
      if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
      fade();
    };

    target.addEventListener('scroll', scroll, { passive: true });
    thumb.addEventListener('pointerdown', down);
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', up);
    thumb.addEventListener('pointercancel', up);
    window.addEventListener('resize', schedulePosition);
    window.addEventListener('scroll', schedulePosition, true);
    const resize = new ResizeObserver(schedulePosition);
    resize.observe(target);
    const children = new Set();
    const observeChildren = () => {
      for (const child of children) {
        if (child.parentElement !== target) {
          resize.unobserve(child);
          children.delete(child);
        }
      }
      for (const child of target.children) {
        if (!children.has(child)) {
          children.add(child);
          resize.observe(child);
        }
      }
      schedulePosition();
    };
    const mutation = new window.MutationObserver(observeChildren);
    mutation.observe(target, { childList: true });
    observeChildren();

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      mutation.disconnect();
      resize.disconnect();
      target.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', schedulePosition);
      window.removeEventListener('scroll', schedulePosition, true);
      target.removeAttribute('tabindex');
      thumb.remove();
    };
  }, [enabled]);

  return (
    <div
      ref={ref}
      id={id}
      className={`${className}${enabled ? ' widgetScrollArea' : ''}`}
      role={enabled ? 'region' : undefined}
      aria-label={enabled ? label : undefined}
    >
      {children}
    </div>
  );
}
