import { readRecent, rememberClip, pickUnseen } from './videoHistory';

const ENDPOINT = 'https://pixabay.com/api/videos/';
const RECENT_KEY = 'pixabayRecent';
const PER_PAGE = 50;
const MAX_PAGE = 10;
const ATTEMPTS = 3;

// Pages past the end of the results come back empty, so the page count is
// learned once per session.
let knownPages = null;

const bestFile = (videos) =>
  ['large', 'medium', 'small', 'tiny']
    .map((size) => videos?.[size])
    .find((file) => file?.url && file.width >= file.height);

const slug = (id) => `pixabay-${id}`;

/** Null when the key is missing or nothing usable came back, so callers can fall back. */
export async function fetchPixabayVideo() {
  const key = (localStorage.getItem('pixabayKey') || '').trim();

  if (!key) {
    return null;
  }

  const query = (localStorage.getItem('pixabayQuery') || '').trim();
  const recent = readRecent(RECENT_KEY);
  const pages = knownPages ?? MAX_PAGE;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const params = new URLSearchParams({
      key,
      per_page: String(PER_PAGE),
      page: String(1 + Math.floor(Math.random() * pages)),
      safesearch: 'true',
    });

    if (query) {
      params.set('q', query);
    }

    try {
      const response = await fetch(`${ENDPOINT}?${params.toString()}`);

      if (!response.ok) {
        console.warn('Pixabay refused the request:', await response.text());
        return null;
      }

      const data = await response.json();
      const hits = Array.isArray(data?.hits) ? data.hits : [];

      if (typeof data?.totalHits === 'number' && !knownPages) {
        knownPages = Math.max(1, Math.min(MAX_PAGE, Math.ceil(data.totalHits / PER_PAGE)));
      }

      const hit = pickUnseen(
        hits,
        attempt === ATTEMPTS - 1 ? [] : recent,
        (item) => bestFile(item?.videos) && slug(item.id),
      );
      const file = bestFile(hit?.videos);

      if (!hit || !file) {
        continue;
      }

      rememberClip(RECENT_KEY, slug(hit.id));

      return {
        url: file.url,
        video: true,
        loop: true,
        muted: true,
        type: 'api',
        currentAPI: 'pixabay',
        photoInfo: {
          hidden: false,
          id: slug(hit.id),
          api: 'pixabay',
          credit: hit.user || 'Pixabay',
          location: null,
          camera: null,
          colour: null,
          duration: hit.duration,
          pageURL: hit.pageURL ?? null,
        },
      };
    } catch (error) {
      console.warn('Pixabay request failed:', error);
    }
  }

  return null;
}
