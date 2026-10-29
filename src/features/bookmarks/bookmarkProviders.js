import { fetchWithTimeout } from 'utils/requests';
import { safeBookmarkUrl } from './bookmarkSelection';

const text = (value, length = 6000) => (typeof value === 'string' ? value.slice(0, length) : '');
const tags = (value) =>
  (Array.isArray(value) ? value : [])
    .flatMap((tag) =>
      typeof tag === 'string'
        ? [tag.slice(0, 100)]
        : typeof tag?.name === 'string'
          ? [tag.name.slice(0, 100)]
          : [],
    )
    .slice(0, 100);
const date = (value) => Date.parse(value) || 0;
export const bookmarkError = (message, retryAt) => Object.assign(new Error(message), { retryAt });

export async function bookmarkRequest(source, path, token, signal) {
  const response = await fetchWithTimeout(
    `${source === 'raindrop' ? 'https://api.raindrop.io/rest/v1' : 'https://readwise.io/api'}${path}`,
    {
      signal,
      headers: { Authorization: `${source === 'raindrop' ? 'Bearer' : 'Token'} ${token}` },
    },
  );
  if (response.status === 401 || response.status === 403) throw bookmarkError('auth');
  if (response.status === 429) {
    const retry = response.headers.get('Retry-After');
    const delay = Number(retry) * 1000 || date(retry) - Date.now() || 60000;
    throw bookmarkError('rate', Date.now() + Math.max(60000, Math.min(delay, DAY)));
  }
  if (response.status === 400 && path.includes('pageCursor=')) throw bookmarkError('cursor');
  if (!response.ok) throw bookmarkError(response.status === 404 ? 'not-found' : 'network');
  return response.json();
}
const DAY = 86400000;

export function raindropBookmark(item, collections = []) {
  const url = safeBookmarkUrl(item?.link);
  if (!url || !item._id || typeof item.title !== 'string') return null;
  return {
    key: `raindrop:${item._id}`,
    source: 'raindrop',
    title: text(item.title, 1000),
    url,
    readerUrl: `https://app.raindrop.io/my/${Number(item.collection?.$id) || 0}/item/${encodeURIComponent(item._id)}`,
    cover: safeBookmarkUrl(item.cover, true),
    description: text(item.excerpt),
    note: text(item.note),
    tags: tags(item.tags),
    type: text(item.type, 50) || 'link',
    author: '',
    collection:
      collections.find((collection) => collection.id === item.collection?.$id)?.title || '',
    created: date(item.created),
    updated: date(item.lastUpdate),
    minutes: 0,
    progress: null,
    favorite: item.important === true,
    openedAt: 0,
  };
}

export function readerBookmark(item) {
  if (!item || item.parent_id || ['highlight', 'note'].includes(item.category)) return null;
  const readerUrl = safeBookmarkUrl(item.url);
  const url = safeBookmarkUrl(item.source_url) || readerUrl;
  if (!url || !item.id || typeof item.title !== 'string') return null;
  return {
    key: `readwise:${item.id}`,
    source: 'readwise',
    title: text(item.title, 1000),
    url,
    readerUrl:
      readerUrl && ['read.readwise.io', 'readwise.io'].includes(new URL(readerUrl).hostname)
        ? readerUrl
        : '',
    cover: safeBookmarkUrl(item.image_url, true),
    description: text(item.summary),
    note: text(item.notes),
    tags: tags(Object.values(item.tags || {})),
    collection: text(item.location, 50),
    type: text(item.category, 50) || 'article',
    author: text(item.author, 300),
    created: date(item.saved_at || item.created_at),
    updated: date(item.updated_at),
    minutes:
      Number.isFinite(item.word_count) && item.word_count > 0
        ? Math.max(1, Math.ceil(item.word_count / 250))
        : 0,
    progress:
      typeof item.reading_progress === 'number'
        ? Math.max(0, Math.min(1, item.reading_progress))
        : null,
    favorite: item.location === 'shortlist',
    openedAt: date(item.last_opened_at),
  };
}

export async function raindropCollections(token, signal) {
  const result = await Promise.all(
    ['/collections', '/collections/childrens'].map((path) =>
      bookmarkRequest('raindrop', path, token, signal),
    ),
  );
  if (result.some((page) => !Array.isArray(page.items))) throw bookmarkError('network');
  return [
    ...new Map(
      result
        .flatMap((page) => page.items)
        .filter((item) => Number.isInteger(item._id) && typeof item.title === 'string')
        .map((item) => [item._id, { id: item._id, title: text(item.title, 300) }]),
    ).values(),
  ];
}

export async function fetchBookmarkPage(source, config, previous, signal) {
  if (source === 'raindrop') {
    const query = new URLSearchParams({
      sort: '-created',
      perpage: '50',
      page: String(previous.page || 0),
      nested: String(config.nested),
      search: config.query,
    });
    const data = await bookmarkRequest(
      source,
      `/raindrops/${config.collection}?${query}`,
      config.token,
      signal,
    );
    if (!Array.isArray(data.items) || data.result === false) throw bookmarkError('network');
    return {
      items: data.items.map((item) => raindropBookmark(item, previous.collections)).filter(Boolean),
      page: (previous.page || 0) + 1,
      cursor: null,
      complete: data.items.length < 50,
    };
  }
  if (config.view === 'review') {
    let data;
    try {
      data = await bookmarkRequest(source, '/v2/review/', config.token, signal);
    } catch (error) {
      if (error.message === 'not-found') return { items: [], complete: true };
      throw error;
    }
    if (!Array.isArray(data.highlights)) throw bookmarkError('network');
    const reviewUrl = safeBookmarkUrl(data.review_url);
    return {
      complete: true,
      items: data.highlights
        .map((item, index) => ({
          key: `readwise:review:${data.review_id}:${index}`,
          source,
          title: text(item.title, 1000),
          url: safeBookmarkUrl(item.source_url) || reviewUrl,
          readerUrl: reviewUrl,
          description: text(item.text, 12000),
          note: text(item.note),
          author: text(item.author, 300),
          type: 'highlight',
          cover: '',
          tags: [],
          collection: '',
          created: date(item.highlighted_at),
          updated: 0,
          minutes: 0,
          progress: null,
          favorite: false,
          openedAt: 0,
        }))
        .filter((item) => item.url),
    };
  }
  const query = new URLSearchParams({ limit: '100' });
  if (previous.cursor) query.set('pageCursor', previous.cursor);
  if (!['all', 'queue'].includes(config.location)) query.set('location', config.location);
  if (config.category !== 'all') query.set('category', config.category);
  if (config.tag) query.set('tag', config.tag);
  const data = await bookmarkRequest(source, `/v3/list/?${query}`, config.token, signal);
  if (
    !Array.isArray(data.results) ||
    (data.nextPageCursor != null && typeof data.nextPageCursor !== 'string')
  )
    throw bookmarkError('network');
  return {
    items: data.results.map(readerBookmark).filter(Boolean),
    cursor: data.nextPageCursor || null,
    complete: !data.nextPageCursor,
    page: (previous.page || 0) + 1,
  };
}
