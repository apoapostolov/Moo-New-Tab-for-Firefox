import { getOfflineImage } from './offlineImage';

/**
 * Every channel serves HLS with `Access-Control-Allow-Origin: *`, so an extension
 * page can play it without a proxy. Open webcam networks forbid embedding, hence
 * ambient channels rather than single webcams.
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

const pickChannel = () => {
  const chosen = localStorage.getItem('liveChannel') || LIVE_CHANNEL_ANY;
  const match = LIVE_CHANNELS.find((channel) => channel.id === chosen);

  if (match) return match;

  return LIVE_CHANNELS[Math.floor(Math.random() * LIVE_CHANNELS.length)];
};

/**
 * Streams are neither queued nor pre-warmed: one is only useful while it plays.
 * `hls` tells the video element to mount a player for the URL.
 */
export async function getLiveBackground(isOffline) {
  if (isOffline) return getOfflineImage('api');

  const channel = pickChannel();

  const data = {
    url: channel.url,
    video: true,
    live: true,
    hls: true,
    loop: false,
    muted: true,
    maxHeight: channel.maxHeight,
    photoInfo: {
      id: channel.id,
      credit: channel.name,
      api: 'live',
    },
  };

  localStorage.setItem('currentBackground', JSON.stringify(data));

  return data;
}
