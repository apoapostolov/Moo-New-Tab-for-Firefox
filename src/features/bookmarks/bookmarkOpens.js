const KEY = 'bookmarksOpenCache';
export function readBookmarkOpens(identity) {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved?.identity === identity && saved.opened && saved.counts
      ? saved
      : { opened: {}, counts: {} };
  } catch {
    return { opened: {}, counts: {} };
  }
}

/** Commit before same-tab navigation; discovery history in IndexedDB can follow afterwards. */
export function recordBookmarkOpen(identity, key, previousCount = 0) {
  try {
    const saved = readBookmarkOpens(identity);
    const opened = { ...saved.opened, [key]: Date.now() };
    const counts = {
      ...saved.counts,
      [key]: Math.max(Number(saved.counts[key]) || 0, Number(previousCount) || 0) + 1,
    };
    const keys = Object.keys(opened)
      .sort((a, b) => opened[b] - opened[a])
      .slice(0, 2000);
    localStorage.setItem(
      KEY,
      JSON.stringify({
        identity,
        opened: Object.fromEntries(keys.map((id) => [id, opened[id]])),
        counts: Object.fromEntries(keys.map((id) => [id, counts[id] || 0])),
      }),
    );
  } catch {
    /* Storage limits must not prevent opening a bookmark. */
  }
}
