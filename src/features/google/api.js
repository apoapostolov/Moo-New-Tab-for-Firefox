import { getAccessToken, refresh } from './auth';

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
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };

  if (options.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !retried) {
    await refresh();

    return googleFetch(path, options, true);
  }

  if (!response.ok) throw new Error(await readError(response));

  // 204s carry no body, and some task calls answer with an empty one.
  if (response.status === 204) return null;

  const text = await response.text();

  return text ? JSON.parse(text) : null;
};
