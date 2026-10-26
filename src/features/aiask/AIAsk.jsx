import { useCallback, useEffect, useRef, useState } from 'react';
import { MdMenuBook, MdTerminal } from 'react-icons/md';
import {
  SiBrave,
  SiClaude,
  SiGithub,
  SiGooglegemini,
  SiOpenai,
  SiPerplexity,
  SiStackoverflow,
  SiWikipedia,
  SiWolframmathematica,
} from 'react-icons/si';

import './aiask.scss';

/**
 * Where a question can be sent, by address alone: no key, no account, nothing to configure,
 * which is the only kind of service this widget can offer.
 *
 * Two kinds, and the difference is worth knowing before adding another. A service that
 * *answers* the address runs the search on arrival, because the server does the work and the
 * URL is the question: `/search?q=…` on a search engine, `input?i=…` on a calculator. One
 * that fills a composer only opens ready to send, one Enter short, because the site chose to
 * keep the send for the person — ChatGPT and Claude both do this deliberately.
 *
 * Google needs `udm=50` (AI Mode; `udm=14` is the plain web view). ChatGPT needs
 * `hints=search` to arm its search tool and `temporary-chat=true` to keep a query typed on a
 * new tab and forgotten out of the account's history. Brave needs `summary=1` to open the
 * AI answer rather than ten links.
 */
const SERVICES = {
  google: {
    group: 'answers',
    name: 'Google AI Mode',
    url: (query) => `https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`,
    Icon: SiGooglegemini,
  },
  perplexity: {
    group: 'answers',
    name: 'Perplexity',
    url: (query) => `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
    Icon: SiPerplexity,
  },
  chatgpt: {
    group: 'answers',
    name: 'ChatGPT',
    url: (query) =>
      `https://chatgpt.com/?q=${encodeURIComponent(query)}&hints=search&temporary-chat=true`,
    Icon: SiOpenai,
  },
  claude: {
    group: 'answers',
    name: 'Claude',
    url: (query) => `https://claude.ai/new?q=${encodeURIComponent(query)}`,
    Icon: SiClaude,
  },
  phind: {
    group: 'answers',
    name: 'Phind',
    url: (query) => `https://www.phind.com/search?q=${encodeURIComponent(query)}`,
    Icon: MdTerminal,
  },
  brave: {
    group: 'answers',
    name: 'Brave AI Answer',
    url: (query) => `https://search.brave.com/search?q=${encodeURIComponent(query)}&summary=1`,
    Icon: SiBrave,
  },
  stackoverflow: {
    group: 'reference',
    name: 'Stack Overflow',
    url: (query) => `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
    Icon: SiStackoverflow,
  },
  mdn: {
    group: 'reference',
    name: 'MDN',
    url: (query) => `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
    Icon: MdMenuBook,
  },
  wikipedia: {
    group: 'reference',
    name: 'Wikipedia',
    url: (query) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`,
    Icon: SiWikipedia,
  },
  wolfram: {
    group: 'reference',
    name: 'Wolfram Alpha',
    url: (query) => `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`,
    Icon: SiWolframmathematica,
  },
  github: {
    group: 'reference',
    name: 'GitHub code',
    url: (query) => `https://github.com/search?q=${encodeURIComponent(query)}&type=code`,
    Icon: SiGithub,
  },
};

/* Two headings rather than one list of eleven: a question about an error message and a
 * question about the weather do not go to the same place, and the menu says so. */
const GROUPS = [
  ['answers', 'Answers'],
  ['reference', 'Reference'],
];

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
  const menu = useRef(null);
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

  /**
   * The menu opens upwards, so the room above the line is all it has: a list long enough to
   * be worth two columns is also long enough to open past the top of a short window. The cap
   * is measured from the widget each time it opens, and the menu scrolls past it.
   */
  useEffect(() => {
    if (!picking) return undefined;

    const cap = () => {
      const above = box.current?.getBoundingClientRect().top ?? 0;
      const room = Math.min(460, window.innerHeight * 0.62, above - 24);

      menu.current?.style.setProperty('max-height', `${Math.max(140, Math.round(room))}px`);
    };

    cap();
    window.addEventListener('resize', cap);

    return () => window.removeEventListener('resize', cap);
  }, [picking]);

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
        <div className="aiAskMenu" role="menu" ref={menu}>
          {GROUPS.map(([id, label]) => {
            const entries = Object.entries(SERVICES).filter(([, item]) => item.group === id);

            if (!entries.length) return null;

            return (
              <div className="aiAskMenuGroup" role="group" aria-label={label} key={id}>
                <span className="aiAskMenuLabel">{label}</span>
                {entries.map(([key, item]) => (
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
            );
          })}
        </div>
      )}
    </form>
  );
};

export { AIAsk as default, AIAsk };
