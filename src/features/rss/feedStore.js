import { parseFeed } from './parseFeed';

/**
 * Every configured feed is fetched on its own, and what comes back is merged into
 * one list. Feeds publish at their own pace, so the answer is kept for a while:
 * the page is opened far more often than a feed changes.
 */

const FEEDS_KEY = 'rssFeeds';
const CACHE_KEY = 'rssItems';
const COUNT_KEY = 'rssItemCount';
const REFRESH_KEY = 'rssRefreshMinutes';
const FULL_ARTICLE_KEY = 'rssFullArticle';

const DEFAULT_COUNT = 12;
// A dozen headlines is the most the card is asked to carry, so an older profile that
// stored more is read back down to it rather than kept.
const MAX_COUNT = 12;
const DEFAULT_REFRESH = 30;
const CACHE_LIMIT = 150;
const EXCERPT_LIMIT = 480;

const readJSON = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

/** Feeds as configured: `[{ url, title }]`. A title is only a label the page shows. */
export function readFeeds() {
  const stored = readJSON(FEEDS_KEY, []);

  return Array.isArray(stored)
    ? stored.filter((feed) => feed && typeof feed.url === 'string' && feed.url)
    : [];
}

export function saveFeeds(feeds) {
  localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds));
}

/** `example.com/feed` is accepted as `https://example.com/feed`; anything else is null. */
export function normaliseUrl(raw) {
  let text = String(raw || '').trim();

  if (!text) return null;

  text = text.replace(/^feed:\/\//i, 'https://');

  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;

  try {
    return new URL(text).toString();
  } catch {
    return null;
  }
}

export function feedTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function readCount() {
  const stored = Number(localStorage.getItem(COUNT_KEY));

  if (!Number.isFinite(stored) || stored < 1) return DEFAULT_COUNT;

  return Math.min(MAX_COUNT, Math.floor(stored));
}

export function readRefresh() {
  const stored = Number(localStorage.getItem(REFRESH_KEY));

  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_REFRESH;
}

/** Reading the whole article is the default; the excerpt is the fallback when it fails. */
export function readFullArticle() {
  return localStorage.getItem(FULL_ARTICLE_KEY) !== 'false';
}

const originOf = (url) => {
  try {
    return `${new URL(url).origin}/*`;
  } catch {
    return null;
  }
};

/**
 * Whether the page may fetch this host. A feed on a host the extension has no
 * access to answers nothing at all, and the reason is not visible from the
 * request, so the answer is checked before blaming the feed.
 */
export async function feedAccess(url) {
  const origin = originOf(url);

  if (!origin || typeof browser === 'undefined' || !browser.permissions) return 'unknown';

  try {
    return (await browser.permissions.contains({ origins: [origin] })) ? 'granted' : 'missing';
  } catch {
    return 'unknown';
  }
}

/** Has to run inside a click: the browser asks on the spot. */
export async function grantAccess(url) {
  const origin = originOf(url);

  if (!origin || typeof browser === 'undefined' || !browser.permissions) return false;

  try {
    return await browser.permissions.request({ origins: [origin] });
  } catch {
    return false;
  }
}

const HEADERS = {
  Accept:
    'application/rss+xml, application/atom+xml, application/rdf+xml, application/xml, text/xml, */*',
};

async function fetchFeed(feed) {
  const response = await fetch(feed.url, { headers: HEADERS });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  return parseFeed(await response.text(), feed.url);
}

/** One link, one headline: feeds syndicate each other, and duplicates read badly. */
const unique = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(item.link || item.id)
      .replace(/[#?].*$/, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);

    return true;
  });
};

export function mergeItems(items) {
  return unique(items)
    .map((item) => ({ ...item, excerpt: item.excerpt.slice(0, EXCERPT_LIMIT) }))
    .sort((a, b) => (b.date || 0) - (a.date || 0));
}

const readCache = () => {
  const cached = readJSON(CACHE_KEY, null);

  if (!cached || !Array.isArray(cached.items) || typeof cached.at !== 'number') return null;

  return cached;
};

/**
 * `{ at, items, errors, cached }`. A feed that fails does not take the others with
 * it: what answered is still worth showing, so the error travels beside the list.
 */
export async function loadItems({ force = false } = {}) {
  const feeds = readFeeds();
  const cached = readCache();

  if (!force && cached && Date.now() - cached.at < readRefresh() * 60000) {
    return { at: cached.at, items: cached.items, errors: cached.errors || [], cached: true };
  }

  const results = await Promise.all(
    feeds.map(async (feed) => {
      try {
        return { feed, ...(await fetchFeed(feed)) };
      } catch (error) {
        return { feed, error: error?.message || 'failed' };
      }
    }),
  );

  const items = mergeItems(results.filter((result) => result.items).flatMap((r) => r.items)).slice(
    0,
    CACHE_LIMIT,
  );

  const errors = results
    .filter((result) => result.error)
    .map((result) => ({ url: result.feed.url, message: result.error }));

  const at = Date.now();

  localStorage.setItem(CACHE_KEY, JSON.stringify({ at, items, errors }));

  return { at, items, errors, cached: false };
}

export function forgetItems() {
  localStorage.removeItem(CACHE_KEY);
}
