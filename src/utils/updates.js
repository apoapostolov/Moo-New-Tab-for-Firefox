import { GITHUB_URL, ORG_NAME, REPO_NAME, VERSION } from 'config/constants';

/**
 * The About page asks GitHub what the newest release is and compares it with the
 * copy that is running. Unauthenticated GitHub allows 60 requests an hour per
 * address, so the answer is kept for six hours rather than fetched on every open.
 */

const CACHE_STORE = 'updateCheck';
const CACHE_TTL = 6 * 60 * 60 * 1000;
// "Nothing published" is kept only briefly: a release that lands after the check
// should show up next time the page is opened, not six hours later.
const EMPTY_TTL = 30 * 60 * 1000;

/** The installed version, from the manifest, so it cannot drift from the build. */
const currentVersion = () => {
  try {
    return browser.runtime.getManifest().version || VERSION;
  } catch {
    return VERSION;
  }
};

/** "v1.0.10" is [1, 0, 10]; anything after a dash is a pre-release and is ignored. */
const parse = (value) =>
  String(value || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);

/** Positive when `candidate` is newer than `installed`, zero when they match. */
const compareVersions = (candidate, installed) => {
  const left = parse(candidate);
  const right = parse(installed);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0);

    if (difference) return difference;
  }

  return 0;
};

const api = (path, signal) =>
  fetch(`${GITHUB_URL}/repos/${ORG_NAME}/${REPO_NAME}/${path}`, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
  });

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_STORE) || 'null');

    if (!cached || typeof cached.at !== 'number') return null;

    const ttl = typeof cached.ttl === 'number' ? cached.ttl : CACHE_TTL;

    return Date.now() - cached.at < ttl ? cached : null;
  } catch {
    return null;
  }
};

/**
 * The newest published release, or null when nothing has been published. Drafts
 * and pre-releases do not count: an unreleased build is not an update anyone can
 * install.
 */
const newestRelease = async (signal) => {
  const latest = await api('releases/latest', signal);

  if (latest.ok) {
    const release = await latest.json();

    return { tag: release.tag_name, url: release.html_url };
  }

  // 404 here means no published non-prerelease release, which is not an error.
  if (latest.status !== 404) throw new Error(`GitHub answered ${latest.status}`);

  const list = await api('releases?per_page=20', signal);

  if (!list.ok) throw new Error(`GitHub answered ${list.status}`);

  const releases = (await list.json()).filter((release) => !release.draft && !release.prerelease);

  if (!releases.length) return null;

  return { tag: releases[0].tag_name, url: releases[0].html_url };
};

/**
 * `{ current, latest, hasUpdate, url }`, with `latest` null when the repository has
 * no published release. `{ cached: true }` marks an answer read from the store.
 */
const checkForUpdate = async ({ signal, force = false } = {}) => {
  const current = currentVersion();
  const cached = !force && readCache();

  if (cached) {
    return {
      current,
      latest: cached.latest,
      hasUpdate: cached.latest ? compareVersions(cached.latest, current) > 0 : false,
      url: cached.url || null,
      cached: true,
    };
  }

  const release = await newestRelease(signal);
  const latest = release ? release.tag.replace(/^v/i, '') : null;

  localStorage.setItem(
    CACHE_STORE,
    JSON.stringify({
      at: Date.now(),
      ttl: latest ? CACHE_TTL : EMPTY_TTL,
      latest,
      url: release ? release.url : null,
    }),
  );

  return {
    current,
    latest,
    hasUpdate: latest ? compareVersions(latest, current) > 0 : false,
    url: release ? release.url : null,
    cached: false,
  };
};

export { checkForUpdate, compareVersions, currentVersion };
