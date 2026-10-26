import { readRecent, rememberClip, pickUnseen } from './videoHistory';

/*
 * Mixkit is the closest thing to Coverr that is still free: a stock-footage site with an
 * explicit licence (commercial use, no attribution, no key) and a catalogue that is mostly
 * the kind of footage a background wants — ink, particles, water, fire, slow clouds.
 *
 * It has no API, so the catalogue is read from the same pages a visitor sees and treated as
 * untrusted, exactly as Coverr's undocumented endpoint is: a card without an id, or one
 * filmed upright, is skipped, and null falls back to the offline image.
 *
 * The catch is CORS. Coverr's endpoint answers with `access-control-allow-origin: *`, so a
 * fetch from the page costs nothing. mixkit.co sends no such header, so the extension has
 * to be given the origin before it may read the catalogue: `mixkitAccess()` reports
 * whether it has been, `grantMixkit()` asks, and that call has to run inside a click.
 *
 * Sizes are not proportional. One measured clip is 1.3 MB at 360, 6.3 MB at 720 and 62.9 MB
 * at 1080. 720 is the size a background wants — sharp behind the cards, a sixth of the
 * bytes — so it is asked for first and 360 is the fallback. The fallback matters twice:
 * 1080 is never requested, and a profile that refused the asset origin still plays, because
 * a <video> element needs no permission to load the file.
 */
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

/** The largest size that answers; 360 is used when neither probe does. */
async function pickFile(id) {
  for (const size of SIZES) {
    const url = ASSET(id, size);

    try {
      const response = await fetch(url, { method: 'HEAD' });

      if (response.ok) return url;
    } catch {
      // No permission for the asset host, or no such size: the next one may still play.
    }
  }

  return ASSET(id, SIZES[SIZES.length - 1]);
}

export async function fetchMixkitVideo() {
  const query = (localStorage.getItem('mixkitQuery') || '').trim();
  const recent = readRecent(RECENT_KEY);

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

      const cards = readCards(await response.text());
      // The last attempt accepts a repeat: an older clip beats a blank fallback.
      const card = pickUnseen(cards, attempt === ATTEMPTS - 1 ? [] : recent, (item) => item.id);

      if (!card) {
        continue;
      }

      rememberClip(RECENT_KEY, card.id);

      return {
        url: await pickFile(card.id),
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
