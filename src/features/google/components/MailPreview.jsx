import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getMessage } from '../services/gmail';
import { describeError } from './ConnectPrompt';

/** Hovering the same row twice should not mean a second trip to Gmail. */
const cache = new Map();

/**
 * The wheel moves a target rather than the scroll position, and the text chases it: that lag is
 * what gives a long message weight instead of jumping line by line.
 */
const SPRING_STIFFNESS = 220;
const SPRING_DAMPING = 26;
const REST_DISTANCE = 0.4;
const REST_SPEED = 4;

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Line and page deltas mean different things to different mice. */
const wheelDistance = (event, viewport) => {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * viewport;

  return event.deltaY;
};

/**
 * The whole message, floating beside the mail card. A manual popover rather than a real one: the
 * card's backdrop-filter clips a fixed child, so this goes in the top layer. Placement ignores the
 * pointer.
 */

const MailPreview = ({ message, anchor, onEnter, onLeave }) => {
  const panel = useRef(null);
  const body = useRef(null);
  const kinetic = useRef({ target: 0, position: 0, velocity: 0, frame: 0, last: 0 });
  const [height, setHeight] = useState(0);
  // The card can change size under an open panel: a row arrives, the zoom moves, the window
  // changes. Placement is state so it can follow.
  const [card, setCard] = useState(() => anchor.getBoundingClientRect());
  const [state, setState] = useState(() =>
    cache.has(message.id)
      ? { loading: false, data: cache.get(message.id), error: '' }
      : { loading: true, data: null, error: '' },
  );

  useEffect(() => {
    const node = panel.current;

    if (!node) return undefined;

    if (typeof node.showPopover === 'function') {
      if (!node.matches(':popover-open')) node.showPopover();
    } else {
      node.setAttribute('open', '');
    }

    return () => {
      if (typeof node.hidePopover === 'function' && node.matches(':popover-open')) {
        node.hidePopover();
      }
    };
  }, []);

  useEffect(() => {
    if (cache.has(message.id)) return undefined;

    let alive = true;

    getMessage(message.id)
      .then((data) => {
        cache.set(message.id, data);

        if (alive) setState({ loading: false, data, error: '' });
      })
      .catch((error) => {
        if (alive) setState({ loading: false, data: null, error: describeError(error.message) });
      });

    return () => {
      alive = false;
    };
  }, [message.id]);

  // A panel cannot be placed before its size is known, and the size arrives with the message.
  // Measuring beats guessing: the preview may be three lines or forty.
  useLayoutEffect(() => {
    const node = panel.current;

    if (!node) return undefined;

    const measure = () => setHeight(node.getBoundingClientRect().height);

    measure();

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;

    observer?.observe(node);
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useLayoutEffect(() => {
    const node = anchor;

    if (!node) return undefined;

    const update = () => setCard(node.getBoundingClientRect());

    update();

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;

    observer?.observe(node);
    window.addEventListener('resize', update);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [anchor]);

  /**
   * The wheel belongs to the message while the message is up, wherever the pointer is. It is
   * caught on the window rather than the panel because the hand is usually down on the list.
   */
  useEffect(() => {
    const node = body.current;

    if (!node) return undefined;

    const motion = kinetic.current;

    motion.position = node.scrollTop;
    motion.target = node.scrollTop;
    motion.velocity = 0;

    const tick = (now) => {
      const elapsed = Math.min(0.032, Math.max(0.001, (now - motion.last) / 1000));
      const furthest = node.scrollHeight - node.clientHeight;

      motion.last = now;

      const displacement = motion.position - motion.target;
      const acceleration = -SPRING_STIFFNESS * displacement - SPRING_DAMPING * motion.velocity;

      motion.velocity += acceleration * elapsed;
      motion.position += motion.velocity * elapsed;

      // A message has two ends: hitting one stops the glide rather than bouncing past, which
      // would read as a broken scroll.
      if (motion.position < 0) {
        motion.position = 0;
        motion.velocity = 0;
      } else if (motion.position > furthest) {
        motion.position = furthest;
        motion.velocity = 0;
      }

      node.scrollTop = motion.position;

      const settled =
        Math.abs(motion.position - motion.target) < REST_DISTANCE &&
        Math.abs(motion.velocity) < REST_SPEED;

      if (settled) {
        motion.position = motion.target;
        node.scrollTop = motion.target;
        motion.velocity = 0;
        motion.frame = 0;

        return;
      }

      motion.frame = window.requestAnimationFrame(tick);
    };

    const onWheel = (event) => {
      if (!event.deltaY) return;

      const furthest = node.scrollHeight - node.clientHeight;

      // Nothing to read past the edges: leave the wheel alone.
      if (furthest <= 0) return;

      event.preventDefault();

      motion.target = Math.max(
        0,
        Math.min(furthest, motion.target + wheelDistance(event, node.clientHeight)),
      );

      if (!motion.frame) {
        motion.last = window.performance.now();
        motion.frame = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);

      if (motion.frame) window.cancelAnimationFrame(motion.frame);

      motion.frame = 0;
    };
  }, []);

  const width = Math.min(430, window.innerWidth - 48);

  // The card's own half of the window decides the side: a card on the left opens its message
  // to the right, a card on the right opens it to the left.
  const besideRight = card.left + card.width / 2 < window.innerWidth / 2;
  const wantedLeft = besideRight ? card.right + 12 : card.left - width - 12;
  const left = Math.max(16, Math.min(wantedLeft, window.innerWidth - width - 16));

  // Pinned to the middle of the window, whatever the row's own position is.
  const maxHeight = Math.min(window.innerHeight * 0.62, window.innerHeight - 32);
  const top = Math.max(16, (window.innerHeight - height) / 2);

  return createPortal(
    <div
      ref={panel}
      popover="manual"
      className="gwPreview"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        // Nothing is painted until the size is known, so the panel never appears in a place it
        // is about to leave.
        visibility: height ? 'visible' : 'hidden',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="gwPreviewHead">
        <span className="gwPreviewFrom">{state.data?.from || message.from}</span>
        <span className="gwPreviewDate">{formatDate(state.data?.date || message.date)}</span>
      </div>

      <p className="gwPreviewSubject">{state.data?.subject || message.subject}</p>

      <div className="gwPreviewBody" ref={body}>
        {state.loading && <p className="gwPreviewNote">Reading the message…</p>}
        {!state.loading && state.error && <p className="gwPreviewNote">{state.error}</p>}
        {!state.loading && !state.error && (state.data?.body || '(no text, only markup)')}
      </div>

      <div className="gwPreviewFoot">
        {state.data?.to && <span>to {state.data.to}</span>}
        {state.data?.attachments > 0 && (
          <span>
            {state.data.attachments} attachment{state.data.attachments === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default MailPreview;
