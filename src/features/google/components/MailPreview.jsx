import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import usePreviewScroll from 'features/widgetKit/usePreviewScroll';

import { getMessage } from '../services/gmail';
import { describeError } from './ConnectPrompt';

/** Hovering the same row twice should not mean a second trip to Gmail. */
const cache = new Map();
const CACHE_LIMIT = 30;
const CACHE_TTL = 5 * 60000;
const readCached = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.at < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
};

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

/**
 * The whole message, floating beside the mail card. A manual popover rather than a real one: the
 * card's backdrop-filter clips a fixed child, so this goes in the top layer. Placement ignores the
 * pointer.
 */

const MailPreview = ({ message, account, anchor, onEnter, onLeave, onClose }) => {
  useTranslationVersion();
  const cacheKey = `${account}:${message.id}`;
  const panel = useRef(null);
  const body = useRef(null);
  const [height, setHeight] = useState(0);
  // The card can change size under an open panel: a row arrives, the zoom moves, the window
  // changes. Placement is state so it can follow.
  const [card, setCard] = useState(() => anchor.getBoundingClientRect());
  const [state, setState] = useState(() => {
    const data = readCached(cacheKey);
    return { loading: !data, data, error: '' };
  });

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
    if (readCached(cacheKey)) return undefined;

    let alive = true;
    const controller = new AbortController();

    getMessage(message.id, { signal: controller.signal })
      .then((data) => {
        if (!alive) return;
        cache.set(cacheKey, { data, at: Date.now() });
        while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);

        if (alive) setState({ loading: false, data, error: '' });
      })
      .catch((error) => {
        if (alive) setState({ loading: false, data: null, error: describeError(error.message) });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [message.id, cacheKey]);

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

  usePreviewScroll(body, cacheKey);

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
      role="region"
      aria-label={uiText('mail_preview_899f31')}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      onFocus={onEnter}
      onBlur={onLeave}
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
        <button
          type="button"
          className="gwIconButton"
          aria-label={uiText('close_mail_preview_47c136')}
          onClick={onClose}
        >
          ×
        </button>
        <span className="gwPreviewFrom">{state.data?.from || message.from}</span>
        <span className="gwPreviewDate">{formatDate(state.data?.date || message.date)}</span>
      </div>

      <p className="gwPreviewSubject">{state.data?.subject || message.subject}</p>

      <div className="gwPreviewBody" ref={body}>
        {state.loading && <p className="gwPreviewNote">{uiText('reading_the_message_b300a1')}</p>}
        {!state.loading && state.error && <p className="gwPreviewNote">{state.error}</p>}
        {!state.loading &&
          !state.error &&
          (state.data?.body || 'This message has no readable text. Open it in Gmail.')}
      </div>

      <div className="gwPreviewFoot">
        {state.data?.to && (
          <span>
            {uiText('to_4374aa')}
            {state.data.to}
          </span>
        )}
        {state.data?.attachments > 0 && (
          <span>
            {state.data.attachments}
            {uiText('attachment_1625e5')}
            {state.data.attachments === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default MailPreview;
