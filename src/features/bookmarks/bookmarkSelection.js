export const MODES = ['latest', 'most_opened', 'mixed', 'shuffle', 'rediscover'];
export const SOURCES = ['browser', 'raindrop', 'readwise'];
const DAY = 86400000;

export function safeBookmarkUrl(value, image = false) {
  try {
    const url = new URL(value);
    return (image ? url.protocol === 'https:' : ['https:', 'http:'].includes(url.protocol)) &&
      !url.username &&
      !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}

export function bookmarkKey(item) {
  if (item.type === 'highlight') return item.key;
  const url = new URL(item.url);
  url.hash = '';
  for (const key of [...url.searchParams.keys()])
    if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  return url.href;
}

export function bookmarkPool(items, source = 'all') {
  const unique = new Map();
  for (const item of items) {
    if (source !== 'all' && source !== item.source) continue;
    if (!safeBookmarkUrl(item.url)) continue;
    const key = bookmarkKey(item);
    const previous = unique.get(key);
    const next = { ...item, selectionKey: key, sources: [item.source] };
    if (!previous) unique.set(key, next);
    else {
      const preferred = item.source === 'readwise' ? next : previous;
      unique.set(key, {
        ...preferred,
        created: Math.max(previous.created || 0, item.created || 0),
        openedAt: Math.max(previous.openedAt || 0, item.openedAt || 0),
        sources: [...new Set([...previous.sources, item.source])],
        tags: [...new Set([...previous.tags, ...item.tags])],
        collection: previous.collection || item.collection,
      });
    }
  }
  return [...unique.values()];
}

export function selectBookmarks(
  items,
  settings,
  history = {},
  now = Date.now(),
  random = Math.random,
  initial = [],
) {
  const age = settings.age * DAY;
  const repeat = settings.repeat * DAY;
  const pool = items.filter(
    (item) =>
      (!settings.hideOpened || !(history.opened?.[item.selectionKey] || item.openedAt)) &&
      (!settings.minMinutes || item.minutes >= settings.minMinutes),
  );
  const recent = [...pool].sort((a, b) => b.created - a.created);
  const old = pool.filter(
    (item) =>
      (settings.mode !== 'rediscover' && settings.mode !== 'mixed') ||
      (item.created && now - item.created >= age),
  );
  const eligible = old.filter(
    (item) =>
      !repeat ||
      !history.shown?.[item.selectionKey] ||
      now - history.shown[item.selectionKey] >= repeat,
  );
  // Shuffle the eligible library, rather than applying random sort to its newest page.
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (settings.balance) {
    const groups = SOURCES.map((source) => shuffled.filter((item) => item.source === source));
    shuffled.splice(0, shuffled.length);
    while (groups.some((group) => group.length))
      for (const group of groups) if (group.length) shuffled.push(group.shift());
  }
  const selected = [];
  const domains = new Map();
  const add = (item) => {
    const domain = new URL(item.url).hostname;
    if (
      selected.length >= settings.limit ||
      selected.some((row) => row.selectionKey === item.selectionKey) ||
      (settings.domainLimit && (domains.get(domain) || 0) >= settings.domainLimit)
    )
      return;
    selected.push(item);
    domains.set(domain, (domains.get(domain) || 0) + 1);
  };
  initial.forEach(add);
  if (settings.mode === 'latest') recent.forEach(add);
  else if (settings.mode === 'most_opened')
    [...pool]
      .sort(
        (a, b) =>
          (history.openCounts?.[b.selectionKey] || 0) -
            (history.openCounts?.[a.selectionKey] || 0) ||
          (history.opened?.[b.selectionKey] || b.openedAt || 0) -
            (history.opened?.[a.selectionKey] || a.openedAt || 0) ||
          b.created - a.created,
      )
      .forEach(add);
  else {
    if (settings.mode === 'mixed')
      recent.slice(0, Math.min(2, Math.ceil(settings.limit / 2))).forEach(add);
    shuffled.forEach(add);
  }
  return { items: selected, eligible: pool.length };
}

export function bookmarkRotation(settings, now = Date.now(), session = '') {
  if (settings.rotation === 'session') return `session:${session}`;
  if (settings.rotation === 'manual') return 'manual';
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
