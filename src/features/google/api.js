import { getAccessToken, refresh, authRevision, authSignal } from './auth';

import { fetchWithTimeout } from 'utils/requests';

const API_BASE = 'https://www.googleapis.com';

const readError = async (response) => {
  const text = await response.text().catch(() => '');

  try {
    const json = JSON.parse(text);

    return json.error?.message || `HTTP ${response.status}`;
  } catch {
    return text || `HTTP ${response.status}`;
  }
};

/**
 * Every Google request goes through here: it attaches the access token, retries once on a 401
 * after refreshing (a token can expire between check and request), and makes error bodies
 * readable.
 */

export const googleFetch = async (path, options = {}, retried = false) => {
  if (localStorage.getItem('offlineMode') === 'true') throw new Error('Moo is in offline mode.');
  const generation = authRevision();
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };

  if (options.body) headers['Content-Type'] = 'application/json';

  const response = await fetchWithTimeout(url, {
    ...options,
    headers,
    signal: AbortSignal.any([authSignal(), ...(options.signal ? [options.signal] : [])]),
  });

  if (generation !== authRevision()) throw new DOMException('Account changed', 'AbortError');
  if (response.status === 401 && !retried) {
    await refresh(true);

    return googleFetch(path, options, true);
  }

  if (!response.ok) throw new Error(await readError(response));

  // 204s carry no body, and some task calls answer with an empty one.
  if (response.status === 204) return null;

  const text = await response.text();

  if (generation !== authRevision()) throw new DOMException('Account changed', 'AbortError');
  options.signal?.throwIfAborted();
  return text ? JSON.parse(text) : null;
};

export async function googlePages(path, { signal, limit = Infinity } = {}) {
  const items = [];
  const seen = new Set();
  let pageToken = '';
  do {
    signal?.throwIfAborted();
    const separator = path.includes('?') ? '&' : '?';
    const page = await googleFetch(
      `${path}${pageToken ? `${separator}pageToken=${encodeURIComponent(pageToken)}` : ''}`,
      { signal },
    );
    items.push(...(page?.items ?? []));
    pageToken = page?.nextPageToken || '';
    if (pageToken && seen.has(pageToken))
      throw new Error('Google returned a repeated page. Refresh to try again.');
    seen.add(pageToken);
  } while (pageToken && items.length < limit);
  return items.slice(0, limit);
}
