import { useCallback, useEffect, useRef, useState } from 'react';
import { MdAutoAwesome } from 'react-icons/md';
import { SiOpenai } from 'react-icons/si';

import './aiask.scss';

/**
 * Asks a question from the new tab page; nothing leaves the page until Enter.
 * Reached by address, with no API key.
 *
 * Google answers the address itself: `udm=50` is AI Mode (`udm=14` is the plain web
 * view), so landing on the link is the search.
 *
 * ChatGPT does not. `?q=` fills the composer and `hints=search` arms the search tool,
 * and OpenAI deliberately stops there — no parameter sends the message, so the tab
 * opens ready to go rather than answered, one Enter behind. `temporary-chat=true` keeps
 * those searches out of the history they would otherwise fill, which is what a query
 * typed on a new tab and forgotten deserves.
 */
const SERVICES = {
  google: {
    name: 'Google AI Mode',
    url: (query) => `https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`,
    Icon: MdAutoAwesome,
  },
  chatgpt: {
    name: 'ChatGPT',
    url: (query) =>
      `https://chatgpt.com/?q=${encodeURIComponent(query)}&hints=search&temporary-chat=true`,
    Icon: SiOpenai,
  },
};

const SERVICE_KEY = 'aiAskService';

const readService = () => {
  const stored = localStorage.getItem(SERVICE_KEY);

  return SERVICES[stored] ? stored : 'google';
};

const AIAsk = () => {
  const [service, setService] = useState(readService);
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(false);
  const [hintHidden, setHintHidden] = useState(false);
  const input = useRef(null);
  const box = useRef(null);
  // Set for a focus the widget takes on its own, so the placeholder can tell that
  // focus from the reader's and stay put for it.
  const autoFocus = useRef(false);

  /**
   * Focus is claimed only while the page is idle, never over a dialog or a note
   * being written, so the widget is ready to type the moment it appears.
   */
  useEffect(() => {
    const claim = () => {
      const active = document.activeElement;

      if (active && active !== document.body && active !== input.current) return;
      if (document.querySelector('.modalBackground')) return;

      autoFocus.current = true;
      input.current?.focus({ preventScroll: true });
    };

    claim();
    window.addEventListener('focus', claim);

    return () => window.removeEventListener('focus', claim);
  }, []);

  // Closes on a click outside the menu, or on Escape.
  useEffect(() => {
    if (!picking) return undefined;

    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && box.current?.contains(event.target)) return;

      setPicking(false);
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);

    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [picking]);

  const submit = (event) => {
    event.preventDefault();

    const asked = query.trim();

    if (!asked) {
      autoFocus.current = true;
      input.current?.focus();

      return;
    }

    window.location.assign(SERVICES[service].url(asked));
  };

  const choose = useCallback((key) => {
    localStorage.setItem(SERVICE_KEY, key);
    setService(key);
    setPicking(false);
    autoFocus.current = true;
    input.current?.focus();
  }, []);

  const { Icon, name } = SERVICES[service];

  return (
    <form className="aiAsk" onSubmit={submit} ref={box}>
      <input
        ref={input}
        className={hintHidden ? 'aiAskInput aiAskHintHide' : 'aiAskInput'}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onPointerDown={() => {
          autoFocus.current = false;
          setHintHidden(true);
        }}
        onFocus={() => {
          if (autoFocus.current) {
            autoFocus.current = false;

            return;
          }

          setHintHidden(true);
        }}
        onBlur={() => setHintHidden(false)}
        placeholder="Ask anything"
        aria-label={`Ask ${name}`}
        autoComplete="off"
        spellCheck="false"
      />
      <button
        type="button"
        className="aiAskService"
        onClick={() => setPicking((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={picking}
        aria-label={name}
        title={name}
      >
        <Icon />
      </button>
      {picking && (
        <div className="aiAskMenu" role="menu">
          {Object.entries(SERVICES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === service}
              className={key === service ? 'aiAskOption aiAskOptionOn' : 'aiAskOption'}
              onClick={() => choose(key)}
            >
              <item.Icon />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export { AIAsk as default, AIAsk };
