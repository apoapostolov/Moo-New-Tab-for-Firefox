import { fetchWithTimeout as fetch } from 'utils/requests';
import { readRecent, rememberClip, pickUnseen } from './videoHistory';

// Coverr's site API is undocumented, so responses are treated as untrusted:
// premium and vertical clips are skipped, and null falls back to the offline
// image.
const COVERR_URL = 'https://coverr.co/api/videos';
const RECENT_KEY = 'coverrRecent';
const PAGES = 40;
const ATTEMPTS = 4;

const usableClip = (hit) =>
  Boolean(hit?.urls?.mp4) && hit.is_premium !== true && hit.is_vertical !== true;

const clipKey = (hit) => (usableClip(hit) ? hit.slug : null);

/** Coverr has no exclude parameter, so random pages are retried until one carries an unseen clip. */
export async function fetchCoverrVideo() {
  const query = (localStorage.getItem('coverrQuery') || '').trim();
  const recent = readRecent(RECENT_KEY);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const params = new URLSearchParams({
      page: String(1 + Math.floor(Math.random() * PAGES)),
      urls: 'true',
    });

    if (query) {
      params.set('query', query);
    }

    try {
      const response = await fetch(`${COVERR_URL}?${params.toString()}`);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      // The last attempt accepts a repeat: an older clip beats a blank fallback.
      const clip = pickUnseen(
        Array.isArray(data?.hits) ? data.hits : [],
        attempt === ATTEMPTS - 1 ? [] : recent,
        clipKey,
      );

      if (!clip) {
        continue;
      }

      rememberClip(RECENT_KEY, clip.slug);

      return {
        url: clip.urls.mp4,
        video: true,
        loop: true,
        muted: true,
        type: 'api',
        currentAPI: 'coverr',
        photoInfo: {
          hidden: false,
          id: clip.slug,
          api: 'coverr',
          credit: (clip.title || 'Coverr').trim(),
          location: null,
          camera: null,
          colour: null,
          blur_hash: clip.blur_hash ?? null,
          duration: clip.duration,
        },
      };
    } catch {
      // Try another catalogue page.
    }
  }

  return null;
}
