import { getOfflineImage } from './offlineImage';
import webcams from './webcams.json';

/** Default live channels; the saved list below allows editing and removal. */
export const LIVE_CHANNELS = [
  {
    id: 'wildearth',
    name: 'WildEarth',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://dqga3jatxofgx.cloudfront.net/WildEarth.m3u8',
  },
  {
    id: 'naturescape',
    name: 'Stingray Naturescape',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://lotus.stingray.com/manifest/naturescape-a003-montreal/samsungtvplus/master.m3u8',
  },
  {
    id: 'lovenature',
    name: 'Love Nature',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg00090-blueantllc-lovenature-au-samsungau-wggcn.amagi.tv/playlist/amg00090-blueantllc-lovenature-au-samsungau/playlist.m3u8',
  },
  {
    id: 'lovenature4k',
    name: 'Love Nature 4K',
    quality: '4K',
    maxHeight: 2160,
    url: 'https://pb-ehs1glsha1juy.akamaized.net/Love_Nature_4K.m3u8',
  },
  {
    id: 'bbcearth',
    name: 'BBC Earth',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg00793-amg00793c6-xumo-us-2669.playouts.now.amagi.tv/BBCStudios-BBCEarthA-hls/playlist.m3u8',
  },
  {
    id: 'inwild',
    name: 'INWILD',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg00861-terninternation-inwild-samsunguk-w5wic.amagi.tv/playlist/amg00861-terninternation-inwild-samsunguk/playlist.m3u8',
  },
  {
    id: 'lovetheplanet',
    name: 'Love the Planet',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg01821-lovetvchannels-lovetheplanetuksamsung-samsunguk-apopw.amagi.tv/playlist/amg01821-lovetvchannels-lovetheplanetuksamsung-samsunguk/playlist.m3u8',
  },
  {
    id: 'realwild',
    name: 'Real Wild',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://cdn-apse1-prod.tsv2.amagi.tv/linear/amg00426-littledotstudio-realwildnz-samsungnz/playlist.m3u8',
  },
  {
    id: 'waterbear',
    name: 'WaterBear',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg01415-waterbearnetwor-waterbear-samsunguk-1h0y8.amagi.tv/playlist/amg01415-waterbearnetwor-waterbear-samsunguk/playlist.m3u8',
  },
  {
    id: 'zenlife',
    name: 'ZenLIFE',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://lotus.stingray.com/manifest/zenlife-zen001-montreal/samsungtvplus/master.m3u8',
  },
  {
    id: '3catcameras',
    name: '3Cat Weather Cameras',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://directes-tv-int.3catdirectes.cat/live-content/beauties-hls/master.m3u8',
  },
  {
    id: 'arubatv',
    name: 'Aruba TV',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://cdn01.setar.aw/Canal49/canal49/playlist.m3u8',
  },
  {
    id: 'weatherchannel',
    name: 'The Weather Channel',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://twcprod-live.twc-tv.com/v1/manifest/b4d4d63a49309cc5140171fb2e92485c31be1e9e/DSP_6228e4760505741a116f1ba2_twcprod-live/6bf09ce5-366b-463c-b67e-c4b799f73c3f/4.m3u8',
  },
  {
    id: 'accuweather',
    name: 'AccuWeather Now',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg00684-accuweather-accuweather-plex/playlist.m3u8',
  },
  {
    id: 'chinatravel',
    name: 'China Travel',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg01314-amg01314c7-distrotv-us-10219.playouts.now.amagi.tv/playlist/amg01314-cgtn-cgtnchinatravel-distrotvus/playlist.m3u8',
  },
  {
    id: 'discoveringchina',
    name: 'Discovering China',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg01314-amg01314c8-distrotv-us-10218.playouts.now.amagi.tv/playlist/amg01314-cgtn-cgtndiscoveringchina-distrotvus/playlist.m3u8',
  },
  {
    id: 'discoverpakistan',
    name: 'Discover Pakistan',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://livecdn.live247stream.com/discoverpakistan/web/playlist.m3u8',
  },
  {
    id: 'turismotravel',
    name: 'Turismo Travel',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://stmv3.voxtvhd.com.br/turismotraveltv/turismotraveltv/playlist.m3u8',
  },
  {
    id: 'yachtingtv',
    name: 'Yachting TV',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://streams2.sofast.tv/vglive-sk-461164/index.m3u8',
  },
  {
    id: 'outdoorchannel',
    name: 'Outdoor Channel',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://cdn-apse1-prod.tsv2.amagi.tv/linear/amg00718-outdoorchannela-outdoortvnz-samsungnz/playlist.m3u8',
  },
  {
    id: 'waypointtv',
    name: 'Waypoint TV',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg00381-waypointcommuni-waypointtv-xumo-syiru.amagi.tv/playlist.m3u8',
  },
  {
    id: 'horsecountry',
    name: 'Horse & Country',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://hnc-free-viewlift.amagi.tv/HNC_AUSTRALIA.m3u8',
  },
  {
    id: 'akctv',
    name: 'AKC TV',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://broadcast.blivenyc.com/speed/broadcast/22/desktop-playlist.m3u8',
  },
  {
    id: 'lovepets',
    name: 'Love Pets',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg01576-blueskyeenterta-lovepetsemea-samsungse-ctamh.amagi.tv/playlist/amg01576-blueskyeenterta-lovepetsemea-samsungse/playlist.m3u8',
  },
  {
    id: 'cgtndoc',
    name: 'CGTN Documentary',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://hlspackager.akamaized.net/live/DB/CGTN_DOCUMENTARY/HLS/CGTN_DOCUMENTARY.m3u8',
  },
  {
    id: 'docubay',
    name: 'DocuBay',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://cc-mgr91yrk4pehy.akamaized.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-mgr91yrk4pehy/playlist.m3u8',
  },
  {
    id: 'dokusat',
    name: 'Dokusat',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://muc3.iptv-playoutcenter.de/dokusat/dokusat1/playlist.m3u8',
  },
  {
    id: 'wedobigstories',
    name: 'WEDO Big Stories',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://amg00735-videosolutionsa-wedobigdocs-ono-0urlz.amagi.tv/playlist/amg00735-videosolutionsa-wedobigdocs-ono/playlist.m3u8',
  },
  {
    id: 'agrotendencia',
    name: 'Agrotendencia',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://5fc584f3f19c9.streamlock.net/agrotendencia/videoagrotendencia_hls1/playlist.m3u8',
  },
  {
    id: 'redbull',
    name: 'Red Bull TV',
    quality: '1080p',
    maxHeight: 1080,
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  },
  ...webcams,
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

  const channels = stored.filter(wellFormed);
  if (localStorage.getItem('liveWebcamCatalogVersion') === '1') return channels;

  // An empty list is deliberate. Existing custom channels and edits stay in place.
  const ids = new Set(channels.map(({ id }) => id));
  const urls = new Set(channels.map(({ url }) => url.toLowerCase()));
  const added = channels.length
    ? webcams.filter(({ id, url }) => !ids.has(id) && !urls.has(url.toLowerCase()))
    : [];
  const migrated = [...channels, ...added];
  try {
    if (added.length) localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
    localStorage.setItem('liveWebcamCatalogVersion', '1');
  } catch {
    return channels;
  }
  return migrated;
}

export function saveChannels(channels) {
  localStorage.setItem(STORE_KEY, JSON.stringify(channels));
  localStorage.setItem('liveWebcamCatalogVersion', '1');
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
    id: freeId(
      name.trim(),
      channels.map((channel) => channel.id),
    ),
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
    channel.id === id
      ? { ...channel, name: changes.name.trim(), url: changes.url.trim() }
      : channel,
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
    type: 'api',
    currentAPI: 'live',
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
