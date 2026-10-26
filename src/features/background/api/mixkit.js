import { fetchWithTimeout as fetch } from 'utils/requests';
import { readRecent, rememberClip, pickUnseen } from './videoHistory';

// Read Mixkit catalogue pages with optional host permission. Prefer 720p, then 360p.
const SITE = 'https://mixkit.co/free-stock-video/';
const SITE_ORIGIN = 'https://mixkit.co/*';
const ASSET_ORIGIN = 'https://assets.mixkit.co/*';
const RECENT_KEY = 'mixkitRecent';
const PAGES = 12;
const ATTEMPTS = 4;
const SIZES = ['720', '360'];
const ASSET = (id, size) => `https://assets.mixkit.co/videos/${id}/${id}-${size}.mp4`;

/** 'granted', 'missing' or 'unknown', read the way the RSS feeds read their hosts. */
export async function mixkitAccess() {
  if (typeof browser === 'undefined' || !browser.permissions) return 'unknown';

  try {
    const granted = await browser.permissions.contains({ origins: [SITE_ORIGIN, ASSET_ORIGIN] });

    return granted ? 'granted' : 'missing';
  } catch {
    return 'unknown';
  }
}

/** Has to run inside a click: the browser asks on the spot. */
export async function grantMixkit() {
  if (typeof browser === 'undefined' || !browser.permissions) return false;

  try {
    return await browser.permissions.request({ origins: [SITE_ORIGIN, ASSET_ORIGIN] });
  } catch {
    return false;
  }
}

const ENTITIES = { '&amp;': '&', '&#39;': "'", '&quot;': '"', '&nbsp;': ' ' };

const clean = (text) =>
  text
    .replace(/&(amp|#39|quot|nbsp);/g, (match) => ENTITIES[match])
    .replace(/\s+/g, ' ')
    .trim();

/**
 * One card per clip. The id rides on the player element and the picture's alt text is the
 * only human name the page offers for it, so that is the credit line.
 */
function readCards(html) {
  const cards = new Map();

  for (const part of html.split('data-item-grid--video-player-item-id-value="').slice(1)) {
    const id = (part.match(/^(\d+)/) || [])[1];
    if (!id || cards.has(id)) continue;

    const width = Number((part.match(/width="(\d+)"/) || [])[1] || 0);
    const height = Number((part.match(/height="(\d+)"/) || [])[1] || 0);

    // A portrait clip is not a background: it would crop to a strip.
    if (width && height && width <= height) continue;

    const alt = (part.match(/alt="([^"]{4,140})"/) || [])[1];

    cards.set(id, { id, title: alt ? clean(alt) : 'Mixkit' });
  }

  return [...cards.values()];
}

/** Skip files that answer with an error; a failed probe still permits direct playback. */
async function pickFile(id) {
  let answered = false;

  for (const size of SIZES) {
    const url = ASSET(id, size);

    try {
      const response = await fetch(url, { method: 'HEAD' });
      answered = true;

      if (response.ok) return url;
    } catch {
      // Blocked or unreachable: the probe proves nothing about this file.
    }
  }

  return answered ? null : ASSET(id, SIZES[0]);
}

/**
 * `excluded` holds the clips the page has already failed to play, so a retry moves on instead
 * of handing back the rectangle that is already black.
 */
export async function fetchMixkitVideo(excluded = []) {
  const query = (localStorage.getItem('mixkitQuery') || '').trim();
  const recent = readRecent(RECENT_KEY);
  // Cards this call has already turned down, so a page full of dead clips cannot be picked
  // from twice and a mixed page still ends with the one that plays.
  const skipped = new Set();

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const params = new URLSearchParams({
      page: String(1 + Math.floor(Math.random() * PAGES)),
    });

    if (query) {
      params.set('q', query);
    }

    try {
      const response = await fetch(`${SITE}?${params.toString()}`);

      if (!response.ok) {
        continue;
      }

      const cards = readCards(await response.text()).filter((item) => !skipped.has(item.id));
      // The last attempt accepts a repeat: an older clip beats a blank fallback.
      const card = pickUnseen(cards, attempt === ATTEMPTS - 1 ? [] : recent, (item) => item.id);

      if (!card) {
        continue;
      }

      const url = await pickFile(card.id);

      // No file, or the one already on screen: this clip is not the answer, and another page
      // of the catalogue is one request away.
      if (!url || excluded.includes(url)) {
        skipped.add(card.id);

        continue;
      }

      rememberClip(RECENT_KEY, card.id);

      return {
        url,
        video: true,
        loop: true,
        muted: true,
        type: 'api',
        currentAPI: 'mixkit',
        photoInfo: {
          hidden: false,
          id: `mixkit-${card.id}`,
          api: 'mixkit',
          credit: card.title,
          location: null,
          camera: null,
          colour: null,
          blur_hash: null,
          duration: null,
        },
      };
    } catch {
      // A blocked or broken page is one attempt, not a reason to stop trying.
    }
  }

  return null;
}
