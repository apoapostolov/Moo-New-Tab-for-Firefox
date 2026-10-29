import { fetchWithTimeout as fetch } from 'utils/requests';

import { readRefresh } from './feedStore';

/**
 * A Feedly account as the card's source. Feedly hands out a personal access token
 * (feedly.com/v3/auth/dev) to Pro and Pro+ accounts and allows 50 calls a day on it, so
 * the widget spends one call on the unread stream, one on the counts beside it, and
 * keeps the answer for the refresh interval the feeds already use.
 */

const API = 'https://cloud.feedly.com/v3';
const TOKEN_KEY = 'feedlyToken';
const REFRESH_KEY = 'feedlyRefreshToken';
const PROFILE_KEY = 'feedlyProfile';
const CACHE_KEY = 'feedlyItems';
const BUDGET_KEY = 'feedlyBudget';

/** Registered by Feedly for the token page; a developer token also renews with it. */
const CLIENT_ID = 'feedlydev';
const CLIENT_SECRET = 'feedlydev';

export const FEEDLY_ORIGIN = 'https://cloud.feedly.com/*';

/** The daily ceiling Feedly documents for a developer token; a header can raise it. */
export const DAILY_CALLS = 50;

const readJSON = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const readFeedlyToken = () => (localStorage.getItem(TOKEN_KEY) || '').trim();

export const readRefreshToken = () => (localStorage.getItem(REFRESH_KEY) || '').trim();

export const saveFeedlyToken = (token) => {
  const value = String(token || '').trim();

  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
};

export const saveRefreshToken = (token) => {
  const value = String(token || '').trim();

  if (value) localStorage.setItem(REFRESH_KEY, value);
  else localStorage.removeItem(REFRESH_KEY);
};

export const forgetFeedly = () => {
  for (const key of [TOKEN_KEY, REFRESH_KEY, PROFILE_KEY, CACHE_KEY, BUDGET_KEY]) {
    localStorage.removeItem(key);
  }
};

const readProfile = () => {
  const stored = readJSON(PROFILE_KEY, null);

  return stored && typeof stored.id === 'string' && stored.id ? stored : null;
};

export const readBudget = () => {
  const stored = readJSON(BUDGET_KEY, null);

  if (!stored || !Number.isFinite(stored.count)) return null;

  return {
    count: Math.max(0, Math.floor(stored.count)),
    limit: Number.isFinite(stored.limit) && stored.limit > 0 ? stored.limit : DAILY_CALLS,
    resetAt: Number.isFinite(stored.resetAt) ? stored.resetAt : 0,
    at: Number.isFinite(stored.at) ? stored.at : 0,
  };
};

/** `{ used, left, limit, resetInMinutes }` or null before the first call. */
export function budgetState(now = Date.now()) {
  const budget = readBudget();

  if (!budget) return null;

  // A counter that reset since the last call belongs to a fresh day.
  const spent = budget.resetAt && now > budget.resetAt ? 0 : budget.count;

  return {
    used: spent,
    left: Math.max(0, budget.limit - spent),
    limit: budget.limit,
    resetInMinutes: budget.resetAt ? Math.max(0, Math.round((budget.resetAt - now) / 60000)) : 0,
  };
}

const rememberBudget = (headers) => {
  if (!headers || typeof headers.get !== 'function') return;

  const count = Number(headers.get('x-ratelimit-count'));
  const limit = Number(headers.get('x-ratelimit-limit'));
  const reset = Number(headers.get('x-ratelimit-reset'));

  if (!Number.isFinite(count)) return;

  localStorage.setItem(
    BUDGET_KEY,
    JSON.stringify({
      count,
      limit: Number.isFinite(limit) && limit > 0 ? limit : DAILY_CALLS,
      resetAt: Number.isFinite(reset) && reset > 0 ? Date.now() + reset * 1000 : 0,
      at: Date.now(),
    }),
  );
};

/**
 * Everything Feedly answers with, and the one sentence the card can say about it.
 * `code` is what the settings page branches on; `message` is shown as it is.
 */
const apiError = (status, data) => {
  const detail = data?.errorMessage || data?.message || data?.error || '';

  const sentences = {
    400: 'Feedly could not understand the request.',
    401: 'The Feedly token is not valid or has expired. Paste a new one in Settings.',
    403: 'Feedly refused this account. A token needs a Pro or Pro+ plan.',
    404: 'Feedly could not find that.',
    429: 'Feedly has used all of today’s calls for this token.',
  };

  const error = new Error(sentences[status] || detail || `Feedly answered ${status}.`);

  error.code = status === 429 ? 'limit' : status === 401 ? 'token' : status === 403 ? 'plan' : 'api';
  error.status = status;

  return error;
};

/**
 * Renews the access token from the refresh token Feedly shows beside a Pro token. The
 * client id and secret are the ones Feedly documents for exactly this exchange.
 */
async function renew() {
  const refreshToken = readRefreshToken();

  if (!refreshToken) return false;

  const response = await fetch(`${API}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  rememberBudget(response.headers);

  if (!response.ok) return false;

  const data = await response.json().catch(() => null);

  if (!data?.access_token) return false;

  localStorage.setItem(TOKEN_KEY, data.access_token);

  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);

  return true;
}

/**
 * One authenticated call. A 401 spends the refresh token once and retries, which is what
 * keeps a widget working past the 30 days a developer token lasts.
 */
async function call(path, { method = 'GET', body, signal, retry = true } = {}) {
  const token = readFeedlyToken();

  if (!token) {
    const error = new Error('No Feedly token yet.');

    error.code = 'no_token';

    throw error;
  }

  const response = await fetch(`${API}${path}`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  rememberBudget(response.headers);

  if (response.status === 401 && retry && (await renew().catch(() => false))) {
    return call(path, { method, body, signal, retry: false });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) throw apiError(response.status, data);

  return data;
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Tags become spaces so two words either side of a <b> do not run together. */
const plain = (html) =>
  String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z][a-z\d]*);/gi, (match, code) => {
      if (code[0] !== '#') return NAMED[code.toLowerCase()] ?? match;

      const point =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));

      return Number.isFinite(point) && point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : match;
    })
    .replace(/\s+/g, ' ')
    .trim();

const firstImage = (html) => {
  const match = /<img[^>]+src\s*=\s*["']([^"']+)["']/i.exec(String(html || ''));

  return match && /^https?:/i.test(match[1]) ? match[1] : null;
};

/**
 * A Feedly entry as the card's own item shape. Feedly keeps the address in `alternate`,
 * the feed in `origin`, and the words in `content.content` (or the shorter `summary`),
 * so everything the card and the reader need arrives in the one call.
 */
export function mapEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const link = entry.alternate?.[0]?.href || entry.origin?.htmlUrl || '';
  const html = entry.content?.content || entry.summary?.content || '';
  const enclosure = (Array.isArray(entry.enclosure) ? entry.enclosure : []).find(
    (item) => item?.href && (!item.type || /^image\//i.test(item.type)),
  );

  return {
    id: String(entry.id || link || crypto.randomUUID?.() || Math.random()),
    entryId: entry.id ? String(entry.id) : '',
    link,
    title: plain(entry.title) || 'Untitled',
    date: Number(entry.published || entry.crawled || entry.updated || 0),
    excerpt: plain(entry.summary?.content || html).slice(0, 480),
    image:
      entry.visual?.url ||
      enclosure?.href ||
      entry.origin?.visualUrl ||
      firstImage(html) ||
      null,
    source: { title: entry.origin?.title || '' },
    folder: entry.categories?.[0]?.label || '',
    content: String(html).slice(0, 20000),
    unread: entry.unread !== false,
  };
}

/** Checks a pasted token and keeps who it belongs to, which the stream id needs. */
export async function verifyFeedly() {
  const profile = await call('/profile');

  if (!profile?.id) {
    const error = new Error('Feedly answered without an account id.');

    error.code = 'api';

    throw error;
  }

  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      id: profile.id,
      email: profile.email || '',
      givenName: profile.givenName || '',
      plan: profile.plan || profile.product || '',
      at: Date.now(),
    }),
  );

  return readProfile();
}

/** `user/<id>/category/global.all`, URL-encoded by the caller. */
export const streamIdFor = (profile) => `user/${profile.id}/category/global.all`;

const readCache = () => {
  const cached = readJSON(CACHE_KEY, null);

  if (!cached || !Array.isArray(cached.items) || typeof cached.at !== 'number') return null;

  return cached;
};

/**
 * `{ items, unread, at, cached, note, needsToken }`. A failure keeps whatever was cached:
 * a widget that throws away yesterday's headlines because today's call failed is worse
 * than one that shows them a little older.
 */
export async function loadFeedly({ force = false, signal, count = 12 } = {}) {
  const cached = readCache();
  const profile = readProfile();

  if (!readFeedlyToken()) return { items: [], unread: null, at: 0, cached: true, needsToken: true, note: '' };

  if (localStorage.getItem('offlineMode') === 'true') {
    return {
      items: cached?.items || [],
      unread: cached?.unread ?? null,
      at: cached?.at || 0,
      cached: true,
      note: '',
    };
  }

  const key = `${profile?.id || 'unknown'}:${count}`;

  if (!force && cached?.key === key && Date.now() - cached.at < readRefresh() * 60000) {
    return {
      items: cached.items,
      unread: cached.unread ?? null,
      at: cached.at,
      cached: true,
      note: '',
    };
  }

  const budget = budgetState();

  if (budget && budget.left <= 0) {
    return {
      items: cached?.items || [],
      unread: cached?.unread ?? null,
      at: cached?.at || 0,
      cached: true,
      note: 'Feedly has used all of today’s calls for this token.',
    };
  }

  let account = profile;

  try {
    if (!account) account = await verifyFeedly();
  } catch (error) {
    return {
      items: cached?.items || [],
      unread: cached?.unread ?? null,
      at: cached?.at || 0,
      cached: true,
      note: error.message,
    };
  }

  const params = new URLSearchParams({
    streamId: streamIdFor(account),
    unreadOnly: 'true',
    count: String(Math.min(100, Math.max(1, count))),
    ranked: 'newest',
  });

  let stream;

  try {
    stream = await call(`/streams/contents?${params}`, { signal });
  } catch (error) {
    return {
      items: cached?.items || [],
      unread: cached?.unread ?? null,
      at: cached?.at || 0,
      cached: true,
      note: error.message,
    };
  }

  const items = (Array.isArray(stream?.items) ? stream.items : []).map(mapEntry).filter(Boolean);

  // The counts are a second call and a nicety: the list is the thing worth having, so a
  // failure here leaves the badge showing what the stream returned.
  let unread = items.length;
  const left = budgetState()?.left ?? 1;

  if (left > 0) {
    try {
      const counts = await call('/markers/counts', { signal });
      const total = (Array.isArray(counts?.unreadcounts) ? counts.unreadcounts : []).find(
        (entryTotal) => String(entryTotal?.id || '').endsWith('/category/global.all'),
      );

      if (total && Number.isFinite(Number(total.count))) unread = Number(total.count);
    } catch {
      // The stream length stands in for the total.
    }
  }

  const at = Date.now();

  signal?.throwIfAborted();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ key, at, items, unread }));

  return { items, unread, at, cached: false, note: '' };
}

/**
 * Marking read is what Feedly's terms require to follow a deliberate action, so this is
 * called from the click that opens a story and nowhere else.
 */
export async function markFeedlyRead(entryIds) {
  const ids = (Array.isArray(entryIds) ? entryIds : [entryIds]).filter(Boolean);

  if (!ids.length) return false;

  try {
    await call('/markers', {
      method: 'POST',
      body: { action: 'markAsRead', type: 'entries', entryIds: ids },
    });
  } catch {
    return false;
  }

  const cached = readCache();

  if (cached) {
    const items = cached.items.filter((item) => !ids.includes(item.entryId));
    const unread = Number.isFinite(cached.unread) ? Math.max(0, cached.unread - ids.length) : null;

    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...cached, items, unread }));
  }

  return true;
}

/** Whether the page may reach Feedly at all, the same question the feeds ask. */
export async function feedlyAccess() {
  if (typeof browser === 'undefined' || !browser.permissions) return 'unknown';

  try {
    return (await browser.permissions.contains({ origins: [FEEDLY_ORIGIN] })) ? 'granted' : 'missing';
  } catch {
    return 'unknown';
  }
}

/** Has to run inside a click: the browser asks on the spot. */
export async function grantFeedlyAccess() {
  if (typeof browser === 'undefined' || !browser.permissions) return false;

  try {
    return await browser.permissions.request({ origins: [FEEDLY_ORIGIN] });
  } catch {
    return false;
  }
}
