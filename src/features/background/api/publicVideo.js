import { fetchWithTimeout as fetch } from 'utils/requests';
import { readRecent, rememberClip, pickUnseen } from './videoHistory';

const clip = (api, id, url, title, pageURL, credit) => ({
  url,
  video: true,
  loop: true,
  muted: true,
  type: 'api',
  currentAPI: api,
  sourceCredit: { text: credit, url: pageURL },
  photoInfo: { hidden: false, id, api, credit, description: title, photoURL: pageURL },
});

export async function fetchNasaVideo() {
  const query = (localStorage.getItem('nasaQuery') || '').trim() || 'earth from space';
  const params = new URLSearchParams({ media_type: 'video', q: query, page_size: '50' });
  try {
    const response = await fetch(`https://images-api.nasa.gov/search?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    const items = (data.collection?.items || [])
      .filter((item) => {
        const info = item.data?.[0];
        return (
          info?.nasa_id &&
          !info.copyright &&
          item.href?.startsWith('https://images-assets.nasa.gov/')
        );
      })
      .sort(() => Math.random() - 0.5);
    const recent = readRecent('nasaRecent');
    for (let tries = 0; items.length && tries < 8; tries++) {
      const item = pickUnseen(items, recent, (entry) => entry.data[0].nasa_id) || items[0];
      items.splice(items.indexOf(item), 1);
      const info = item.data[0];
      const assetsResponse = await fetch(item.href);
      if (!assetsResponse.ok) continue;
      const assets = await assetsResponse.json();
      if (!Array.isArray(assets)) continue;
      const files = assets
        .map((url) => {
          try {
            const parsed = new URL(url);
            if (parsed.hostname !== 'images-assets.nasa.gov') return null;
            parsed.protocol = 'https:';
            return parsed.href;
          } catch {
            return null;
          }
        })
        .filter((url) => url && /\.mp4(?:\?|$)/i.test(url));
      const url =
        files.find((file) => /~medium\.mp4/i.test(file)) ||
        files.find((file) => /~large\.mp4/i.test(file)) ||
        files[0];
      if (!url) continue;
      rememberClip('nasaRecent', info.nasa_id);
      return clip(
        'nasa',
        `nasa-${info.nasa_id}`,
        url,
        info.title,
        `https://images.nasa.gov/details/${encodeURIComponent(info.nasa_id)}`,
        'NASA',
      );
    }
  } catch (error) {
    console.warn('NASA video request failed:', error);
  }
  return null;
}

export async function fetchCommonsVideo() {
  const query = (localStorage.getItem('commonsQuery') || '').trim() || 'landscape';
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:video ${query}`,
    gsrnamespace: '6',
    gsrlimit: '50',
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    format: 'json',
    origin: '*',
  });
  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {})
      .filter((page) => {
        const info = page.imageinfo?.[0];
        const license = info?.extmetadata?.LicenseShortName?.value || '';
        return (
          /^(CC0|Public domain)/i.test(license) &&
          /^video\/(webm|mp4)$/.test(info?.mime || '') &&
          info?.url?.startsWith('https://upload.wikimedia.org/')
        );
      })
      .sort(() => Math.random() - 0.5);
    const selected =
      pickUnseen(pages, readRecent('commonsRecent'), (page) => page.pageid) || pages[0];
    if (!selected) return null;
    const id = String(selected.pageid);
    rememberClip('commonsRecent', id);
    return clip(
      'commons',
      `commons-${id}`,
      selected.imageinfo[0].url,
      selected.title,
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(selected.title.replace(/ /g, '_'))}`,
      'Wikimedia Commons',
    );
  } catch (error) {
    console.warn('Wikimedia Commons video request failed:', error);
  }
  return null;
}
