/** Prefetched articles. Keep only visible headlines, within the configured lifetime. */

const CACHE_KEY = 'rssArticles';
const TTL_KEY = 'rssArticleTtl';
const HOUR = 3600000;

export const DEFAULT_TTL_HOURS = 168;

const readAll = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY));

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const writeAll = (all) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // A full quota must not break a new tab; the reader falls back to fetching.
  }
};

export function readTtlHours() {
  const stored = Number(localStorage.getItem(TTL_KEY));

  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_TTL_HOURS;
}

const fresh = (entry, now, limit) => Boolean(entry) && now - Number(entry.at || 0) <= limit;

/** `{ url, title, image, blocks }`, the same shape `fetchArticle` returns, or null. */
export function readArticle(link) {
  if (!link) return null;

  const entry = readAll()[link];

  if (!fresh(entry, Date.now(), readTtlHours() * HOUR)) return null;
  if (!Array.isArray(entry.blocks) || !entry.blocks.length) return null;

  return { url: link, title: entry.title || '', image: entry.image || null, blocks: entry.blocks };
}

export function storeArticle(link, article) {
  if (!link || !Array.isArray(article?.blocks) || !article.blocks.length) return;

  const all = readAll();

  all[link] = {
    at: Date.now(),
    title: article.title || '',
    image: article.image || null,
    blocks: article.blocks,
  };

  writeAll(all);
}

/**
 * Keeps the entries for the links given and drops everything else, along with any
 * entry past its age. One read and one write for the whole list.
 */
export function pruneArticles(keep) {
  const all = readAll();
  const limit = readTtlHours() * HOUR;
  const now = Date.now();
  const next = {};

  for (const [link, entry] of Object.entries(all)) {
    if (keep.has(link) && fresh(entry, now, limit)) next[link] = entry;
  }

  if (Object.keys(next).length !== Object.keys(all).length) writeAll(next);

  return Object.keys(next).length;
}

/** The lead image of every cached story, for the thumbnails beside the headlines. */
export function cachedImages(links) {
  const all = readAll();
  const limit = readTtlHours() * HOUR;
  const now = Date.now();
  const images = {};

  for (const link of links) {
    if (!link) continue;

    const entry = all[link];

    if (fresh(entry, now, limit) && entry.image) images[link] = entry.image;
  }

  return images;
}

export function forgetArticles() {
  localStorage.removeItem(CACHE_KEY);
}
