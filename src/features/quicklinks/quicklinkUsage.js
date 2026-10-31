import { readQuicklinks } from './options/utils/quicklinksUtils.js';

export const QUICKLINK_USAGE_KEY = 'quicklinksUsage';
export const QUICKLINK_USAGE_DAYS = 30;
const DAY = 86400000;
const lists = ['quicklinks', 'focusQuicklinks'];
const identity = (list, item) => JSON.stringify([list, item.key, item.url]);

/** Daily UTC buckets keep a bounded, date-based window without storing individual visits. */
export function normalizeQuicklinkUsage(value, now = Date.now()) {
  const today = Math.floor(now / DAY);
  if (value?.version !== 1 || !Array.isArray(value.entries)) return { version: 1, entries: [] };
  const seen = new Set();
  const entries = [];
  for (const entry of value.entries.slice(0, 10000)) {
    if (
      !entry ||
      !lists.includes(entry.list) ||
      typeof entry.key !== 'string' ||
      typeof entry.url !== 'string' ||
      !Array.isArray(entry.days)
    )
      continue;
    const id = identity(entry.list, entry);
    if (seen.has(id)) continue;
    seen.add(id);
    const days = new Map();
    for (const bucket of entry.days.slice(0, 60)) {
      if (!Array.isArray(bucket)) continue;
      const [day, count] = bucket;
      if (
        Number.isInteger(day) &&
        day > today - QUICKLINK_USAGE_DAYS &&
        day <= today &&
        Number.isSafeInteger(count) &&
        count > 0
      )
        days.set(day, Math.min(1000000, (days.get(day) || 0) + count));
    }
    if (days.size)
      entries.push({
        list: entry.list,
        key: entry.key,
        url: entry.url,
        days: [...days].sort((a, b) => a[0] - b[0]),
      });
  }
  return { version: 1, entries };
}

export function readQuicklinkUsage(now = Date.now()) {
  try {
    return normalizeQuicklinkUsage(JSON.parse(localStorage.getItem(QUICKLINK_USAGE_KEY)), now);
  } catch {
    return { version: 1, entries: [] };
  }
}

export function rankQuicklinks(items, usage, list = 'quicklinks') {
  const counts = new Map(
    usage.entries
      .filter((entry) => entry.list === list)
      .map((entry) => [
        identity(list, entry),
        entry.days.reduce((sum, [, count]) => sum + count, 0),
      ]),
  );
  return items
    .map((item, index) => ({ item, index, count: counts.get(identity(list, item)) || 0 }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ item }) => item);
}

export function pruneQuicklinkUsage(now = Date.now(), persist = true) {
  const usage = readQuicklinkUsage(now);
  const active = new Set(
    lists.flatMap((list) => readQuicklinks(list).map((item) => identity(list, item))),
  );
  usage.entries = usage.entries.filter((entry) => active.has(identity(entry.list, entry)));
  try {
    if (!persist) return usage;
    if (usage.entries.length) localStorage.setItem(QUICKLINK_USAGE_KEY, JSON.stringify(usage));
    else localStorage.removeItem(QUICKLINK_USAGE_KEY);
  } catch {
    /* Frequency sorting must never block opening a link. */
  }
  return usage;
}

export function recordQuicklinkOpen(item, list = 'quicklinks', now = Date.now()) {
  if (localStorage.getItem('quicklinksOrderByFrequency') !== 'true' || !lists.includes(list))
    return null;
  if (!readQuicklinks(list).some((link) => link.key === item.key && link.url === item.url))
    return null;
  const usage = pruneQuicklinkUsage(now, false);
  let entry = usage.entries.find(
    (entry) => entry.list === list && entry.key === item.key && entry.url === item.url,
  );
  if (!entry) {
    entry = { list, key: item.key, url: item.url, days: [] };
    usage.entries.push(entry);
  }
  const day = Math.floor(now / DAY),
    bucket = entry.days.find(([date]) => date === day);
  if (bucket) bucket[1] = Math.min(1000000, bucket[1] + 1);
  else entry.days.push([day, 1]);
  try {
    localStorage.setItem(QUICKLINK_USAGE_KEY, JSON.stringify(usage));
  } catch {
    return null;
  }
  return usage;
}
