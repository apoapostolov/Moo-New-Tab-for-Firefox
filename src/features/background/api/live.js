import { getOfflineImage } from './offlineImage';

/**
 * The channels a fresh profile starts with. Every one serves HLS with
 * `Access-Control-Allow-Origin: *`, so an extension page can play it without a proxy.
 * Open webcam networks forbid embedding, hence ambient channels rather than single
 * webcams. These are only the starting list: the store below is what the page reads.
 */
export const LIVE_CHANNELS = [
  {
    id: 'wildearth',
    name: 'WildEarth',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://dqga3jatxofgx.cloudfront.net/WildEarth.m3u8',
  },
  {
    id: 'zenlife',
    name: 'ZenLIFE',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://lotus.stingray.com/manifest/zenlife-zen001-montreal/samsungtvplus/master.m3u8',
  },
  {
    id: 'lovenature',
    name: 'Love Nature',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://mumbai-edge.smartplaytv.in/LoveNature/index.m3u8',
  },
  {
    id: 'lovenature4k',
    name: 'Love Nature 4K',
    quality: '4K',
    maxHeight: 2160,
    url: 'https://pb-ehs1glsha1juy.akamaized.net/Love_Nature_4K.m3u8',
  },
  {
    id: 'redbull',
    name: 'Red Bull TV',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  },
];

export const LIVE_CHANNEL_ANY = 'any';

const STORE_KEY = 'liveChannels';

// Read by the player as well as the settings panel, so a stored list is trusted but never blindly.
const wellFormed = (channel) =>
  channel &&
  typeof channel.id === 'string' &&
  channel.id.length > 0 &&
  typeof channel.name === 'string' &&
  typeof channel.url === 'string';

/**
 * Every channel the page may play: the built-in ones until something is changed, then
 * whatever the profile holds. An empty list is a real answer — every channel was
 * deleted — so it is returned as it stands rather than filled back in.
 */
export function readChannels() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem(STORE_KEY));
  } catch {
    stored = null;
  }

  if (!Array.isArray(stored)) return LIVE_CHANNELS;

  return stored.filter(wellFormed);
}

export function saveChannels(channels) {
  localStorage.setItem(STORE_KEY, JSON.stringify(channels));
}

/**
 * Whether the list still matches the built-in set, so the reset can stay hidden. Names and
 * addresses count as well as ids: a renamed built-in is no longer the built-in channel, and
 * hiding the reset would leave that rename with no way back.
 */
export function isBuiltInList(channels = readChannels()) {
  return (
    channels.length === LIVE_CHANNELS.length &&
    LIVE_CHANNELS.every((builtIn, index) => {
      const channel = channels[index];

      return (
        channel &&
        channel.id === builtIn.id &&
        channel.name === builtIn.name &&
        channel.url === builtIn.url
      );
    })
  );
}

export function isStreamUrl(url) {
  try {
    const parsed = new URL(url);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** HLS needs hls.js in Firefox; a plain video file plays in the element itself. */
export const isHls = (url) => /\.m3u8(\?|#|$)/i.test(url);

const slugFor = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'channel';

/** An id that will not collide with one already in the list. */
export function freeId(name, taken) {
  const base = slugFor(name);
  let id = base;
  let suffix = 2;

  while (taken.includes(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
}

export function makeChannel({ name, url }) {
  const channels = readChannels();

  return {
    id: freeId(name.trim(), channels.map((channel) => channel.id)),
    name: name.trim(),
    url: url.trim(),
    maxHeight: 1080,
  };
}

export function addChannel(channel) {
  const next = [...readChannels(), channel];

  saveChannels(next);

  return next;
}

/** A channel keeps its id when renamed, so the saved selection and the photo credit follow it. */
export function updateChannel(id, changes) {
  const next = readChannels().map((channel) =>
    channel.id === id ? { ...channel, name: changes.name.trim(), url: changes.url.trim() } : channel,
  );

  saveChannels(next);

  return next;
}

/** Deleting the channel the page was set to leaves the selector on "any" rather than on nothing. */
export function removeChannel(id) {
  const next = readChannels().filter((channel) => channel.id !== id);

  saveChannels(next);

  if (localStorage.getItem('liveChannel') === id) {
    localStorage.setItem('liveChannel', LIVE_CHANNEL_ANY);
  }

  return next;
}

/**
 * Back to the built-in set. A selection pointing at a channel that only existed in the
 * profile goes back to "any" with it, or the selector would name something absent.
 */
export function restoreChannels() {
  localStorage.removeItem(STORE_KEY);

  const chosen = localStorage.getItem('liveChannel');

  if (chosen && chosen !== LIVE_CHANNEL_ANY && !LIVE_CHANNELS.some(({ id }) => id === chosen)) {
    localStorage.setItem('liveChannel', LIVE_CHANNEL_ANY);
  }

  return LIVE_CHANNELS;
}

const pickChannel = () => {
  const channels = readChannels();

  if (channels.length === 0) return null;

  const chosen = localStorage.getItem('liveChannel') || LIVE_CHANNEL_ANY;
  const match = channels.find((channel) => channel.id === chosen);

  return match || channels[Math.floor(Math.random() * channels.length)];
};

/**
 * Streams are neither queued nor pre-warmed: one is only useful while it plays.
 * `hls` tells the video element to mount a player for the URL.
 */
export async function getLiveBackground(isOffline) {
  const channel = pickChannel();

  // Every channel deleted, or the page is offline: there is nothing live to show.
  if (!channel || isOffline) return getOfflineImage('api');

  const data = {
    url: channel.url,
    video: true,
    live: true,
    hls: isHls(channel.url),
    loop: false,
    muted: true,
    maxHeight: channel.maxHeight || 1080,
    photoInfo: {
      id: channel.id,
      credit: channel.name,
      api: 'live',
    },
  };

  localStorage.setItem('currentBackground', JSON.stringify(data));

  return data;
}
