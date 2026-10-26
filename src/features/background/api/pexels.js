import { fetchWithTimeout as fetch } from 'utils/requests';
import { readRecent, rememberClip, pickUnseen } from './videoHistory';

const SEARCH_URL = 'https://api.pexels.com/videos/search';
const POPULAR_URL = 'https://api.pexels.com/videos/popular';
const RECENT_KEY = 'pexelsRecent';
const PER_PAGE = 20;
const MAX_PAGE = 40;
const ATTEMPTS = 3;

const slug = (id) => `pexels-${id}`;

/**
 * 4K costs several times the bytes for no visible gain on a background, so
 * 1080p wins where a source offers it.
 */
function bestFile(video) {
  const files = (video?.video_files || []).filter(
    (file) => file?.file_type === 'video/mp4' && file.link && file.width >= file.height,
  );

  if (!files.length) {
    return null;
  }

  const atFullHd = files
    .filter((file) => file.width >= 1280 && file.width <= 1920)
    .sort((a, b) => b.width - a.width);

  if (atFullHd.length) {
    return atFullHd[0];
  }

  const smaller = files.filter((file) => file.width < 1280).sort((a, b) => b.width - a.width);

  return smaller[0] ?? files.slice().sort((a, b) => a.width - b.width)[0];
}

/** Null when the key is missing or nothing usable came back, so callers can fall back. */
export async function fetchPexelsVideo() {
  const key = (localStorage.getItem('pexelsKey') || '').trim();

  if (!key) {
    return null;
  }

  const query = (localStorage.getItem('pexelsQuery') || '').trim();
  const recent = readRecent(RECENT_KEY);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const params = new URLSearchParams({
      per_page: String(PER_PAGE),
      page: String(1 + Math.floor(Math.random() * MAX_PAGE)),
      orientation: 'landscape',
    });

    let endpoint = POPULAR_URL;

    if (query) {
      endpoint = SEARCH_URL;
      params.set('query', query);
    }

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: key },
      });

      if (!response.ok) {
        console.warn('Pexels refused the request:', await response.text());
        return null;
      }

      const data = await response.json();
      const videos = Array.isArray(data?.videos) ? data.videos : [];
      // The last attempt accepts a repeat: an older clip beats a blank fallback.
      const seen = attempt === ATTEMPTS - 1 ? [] : recent;
      const video = pickUnseen(videos, seen, (item) => bestFile(item) && slug(item.id));
      const file = bestFile(video);

      if (!video || !file) {
        continue;
      }

      rememberClip(RECENT_KEY, slug(video.id));

      return {
        url: file.link,
        video: true,
        loop: true,
        muted: true,
        type: 'api',
        currentAPI: 'pexels',
        photoInfo: {
          hidden: false,
          id: slug(video.id),
          api: 'pexels',
          credit: video.user?.name || 'Pexels',
          location: null,
          camera: null,
          colour: video.avg_color ?? null,
          duration: video.duration,
          pageURL: video.url ?? null,
        },
      };
    } catch (error) {
      console.warn('Pexels request failed:', error);
    }
  }

  return null;
}
