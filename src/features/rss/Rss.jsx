import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdRefresh } from 'react-icons/md';

import { getSurface } from 'utils/widgetSurface';
import EventBus from 'utils/eventbus';

import { loadItems, readCount, readFullArticle, readRefresh } from './feedStore';
import { fetchArticle } from './extractArticle';
import { cachedImages, pruneArticles, readArticle, storeArticle } from './articleCache';

import './rss.scss';

const ARTICLE_DELAY = 260;

/** "3h" reads faster than a timestamp when every row is a headline. */
const relative = (stamp) => {
  if (!stamp) return '';

  const minutes = Math.round((Date.now() - stamp) / 60000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);

  if (days < 7) return `${days}d`;

  return new Date(stamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Headlines from every feed in one list. Hovering a row opens a reader beside it:
 * the article itself when it is already kept, the feed's own summary until then, so
 * the digest is readable without leaving the new tab. With full articles on, the page
 * reads them while it stands rather than when the pointer arrives.
 */
const Rss = () => {
  const [feeds, setFeeds] = useState({ items: [], errors: [], loading: true });
  const [open, setOpen] = useState(null);
  const [article, setArticle] = useState({ status: 'idle' });
  const [tick, setTick] = useState(0);
  // Bumped whenever the article cache changes, so the thumbnails pick up new images.
  const [stored, setStored] = useState(0);

  const panel = useRef(null);
  const closeTimer = useRef(null);
  const articleTimer = useRef(null);

  const load = useCallback(async (force = false) => {
    setFeeds((previous) => ({ ...previous, loading: previous.items.length === 0 }));

    try {
      const result = await loadItems({ force });

      setFeeds({
        items: result.items.slice(0, readCount()),
        errors: result.errors,
        loading: false,
      });
    } catch (error) {
      setFeeds((previous) => ({
        ...previous,
        loading: false,
        errors: [{ url: '', message: error?.message || 'failed' }],
      }));
    }
  }, []);

  useEffect(() => {
    load();

    const refresh = setInterval(() => load(true), readRefresh() * 60000);
    const ages = setInterval(() => setTick((value) => value + 1), 60000);
    const onRefresh = (target) => {
      if (!target || target === 'rss') load(true);
    };

    EventBus.on('refresh', onRefresh);

    return () => {
      clearInterval(refresh);
      clearInterval(ages);
      EventBus.off('refresh', onRefresh);
    };
  }, [load]);

  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
      clearTimeout(articleTimer.current);
    },
    [],
  );

  // The card's own list is the licence to keep an article: anything it stops showing
  // goes, and anything past its age goes with it. It waits for that list: the first
  // render has none, and a prune against it would empty the cache on every visit.
  useEffect(() => {
    if (feeds.loading || !feeds.items.length) return;

    const links = feeds.items.map((item) => item.link).filter(Boolean);

    pruneArticles(new Set(links));
    setStored((value) => value + 1);
  }, [feeds.items, feeds.loading]);

  /**
   * Reading the articles while the page stands. One after another rather than all at
   * once: a dozen parallel page loads is a rude way to treat a dozen publishers, and
   * the pointer is rarely faster than the second story.
   */
  useEffect(() => {
    if (!readFullArticle()) return undefined;

    const items = feeds.items;
    let stopped = false;

    (async () => {
      for (const item of items) {
        if (stopped) return;

        if (!item.link || readArticle(item.link)) continue;

        try {
          storeArticle(item.link, await fetchArticle(item.link));
          if (!stopped) setStored((value) => value + 1);
        } catch {
          // Not every page can be read; the row keeps the feed's own summary.
        }
      }
    })();

    return () => {
      stopped = true;
    };
  }, [feeds.items]);

  const thumbs = useMemo(() => {
    const links = feeds.items.map((item) => item.link).filter(Boolean);
    const images = cachedImages(links);
    const out = {};

    for (const item of feeds.items) out[item.link] = item.image || images[item.link] || null;

    return out;
  }, [feeds.items, stored]);

  const keep = () => {
    if (!closeTimer.current) return;

    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const hide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      clearTimeout(articleTimer.current);
      setOpen(null);
      setArticle({ status: 'idle' });
    }, 140);
  };

  const show = (item, element) => {
    keep();
    clearTimeout(articleTimer.current);
    setOpen({ item, element });

    // Kept already: there is nothing to wait for, so nothing is shown waiting.
    const kept = item.link ? readArticle(item.link) : null;

    if (kept) {
      setArticle({ status: 'ready', article: kept });

      return;
    }

    setArticle({ status: 'idle' });

    if (!readFullArticle()) return;

    articleTimer.current = setTimeout(async () => {
      setArticle({ status: 'loading' });

      try {
        const fetched = await fetchArticle(item.link);

        storeArticle(item.link, fetched);
        setStored((value) => value + 1);
        setArticle({ status: 'ready', article: fetched });
      } catch {
        setArticle({ status: 'unavailable' });
      }
    }, ARTICLE_DELAY);
  };

  /**
   * The panel is placed after it has been measured, and it stands beside the card rather than
   * over it. The rule is the mail preview's, down to the numbers: the card's own half of the
   * window decides the side, the panel is pinned to the middle of the window, and its height
   * is the same share of the window — two panels that open from a row should not drift apart.
   */
  useLayoutEffect(() => {
    const node = panel.current;

    if (!node || !open) return undefined;

    const place = () => {
      const width = Math.min(430, window.innerWidth - 48);
      const card = open.element?.getBoundingClientRect();

      node.style.width = `${width}px`;
      node.style.maxHeight = `${Math.min(window.innerHeight * 0.62, window.innerHeight - 32)}px`;

      if (!card) return;

      const besideRight = card.left + card.width / 2 < window.innerWidth / 2;
      const wantedLeft = besideRight ? card.right + 12 : card.left - width - 12;

      node.style.left = `${Math.round(Math.max(16, Math.min(wantedLeft, window.innerWidth - width - 16)))}px`;
      node.style.top = `${Math.round(Math.max(16, (window.innerHeight - node.offsetHeight) / 2))}px`;
    };

    place();

    // The panel grows as the article arrives and its picture loads, and the placement is
    // measured from its height, so the height has to be watched rather than taken once.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;

    observer?.observe(node);
    window.addEventListener('resize', place);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [open, article.status, article.article, tick]);

  const failed = feeds.errors.filter((error) => error.url);
  const blocks = article.status === 'ready' ? article.article.blocks : null;

  const reader =
    open &&
    createPortal(
      <div
        className="rssReader"
        ref={panel}
        role="dialog"
        aria-label={open.item.title}
        onMouseEnter={keep}
        onMouseLeave={hide}
      >
        <div className="rssReaderHead">
          <span className="rssReaderSource">{open.item.source.title}</span>
          <span className="rssReaderAge">{relative(open.item.date)}</span>
        </div>

        <h3 className="rssReaderTitle">{open.item.title}</h3>

        {article.status === 'loading' ? <p className="rssReaderNote">Reading the article…</p> : null}

        {article.article?.image ? (
          <img className="rssReaderImage" src={article.article.image} alt="" loading="lazy" />
        ) : null}

        {blocks
          ? blocks.map((block, index) => (
              <p className={`rssBlock rssBlock-${block.tag}`} key={`${index}-${block.text.slice(0, 24)}`}>
                {block.text}
              </p>
            ))
          : null}

        {!blocks && open.item.excerpt ? (
          <p className="rssBlock rssBlock-p">{open.item.excerpt}</p>
        ) : null}

        {article.status === 'unavailable' ? (
          <p className="rssReaderNote">The article could not be read here.</p>
        ) : null}

        <footer className="rssReaderFoot">
          <a href={open.item.link} target="_blank" rel="noopener noreferrer">
            Open article
          </a>
        </footer>
      </div>,
      document.body,
    );

  return (
    <section className={`rssWidget ${getSurface('rss')}`} aria-label="RSS headlines">
      <header className="rssHead">
        <span className="rssLabel">Reading</span>
        <button
          className="rssRefresh"
          type="button"
          aria-label="Refresh feeds"
          onClick={() => load(true)}
        >
          <MdRefresh />
        </button>
      </header>

      {feeds.loading ? <p className="rssNote">Fetching headlines…</p> : null}

      {!feeds.loading && !feeds.items.length ? (
        <p className="rssNote">No headlines yet. Add feeds in Settings, under RSS.</p>
      ) : null}

      <ul className="rssList" onMouseLeave={hide}>
        {feeds.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`rssItem${thumbs[item.link] ? ' rssItem-hasThumb' : ''}`}
              onMouseEnter={(event) => show(item, event.currentTarget)}
              onFocus={(event) => show(item, event.currentTarget)}
              onBlur={hide}
              onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
            >
              {thumbs[item.link] ? (
                <img
                  className="rssThumb"
                  src={thumbs[item.link]}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.remove();
                  }}
                />
              ) : null}
              {/* Source and age share the line above the headline, so the age is placed
                  before the headline in the grid rather than after it: written after, the
                  headline spanning both columns pushed it onto a line of its own. */}
              <span className="rssSource">{item.source.title}</span>
              <span className="rssAge">{relative(item.date)}</span>
              <span className="rssItemTitle">{item.title}</span>
            </button>
          </li>
        ))}
      </ul>

      {failed.length ? (
        <p className="rssNote rssNote-warn" title={failed.map((error) => `${error.url}: ${error.message}`).join('\n')}>
          {failed.length === 1 ? '1 feed did not answer.' : `${failed.length} feeds did not answer.`}
        </p>
      ) : null}

      {reader}
    </section>
  );
};

export default Rss;
