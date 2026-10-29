import { withLock } from 'utils/requests';
import { readBookmarkCache, writeBookmarkCache } from './bookmarkCache';
import { selectBookmarks } from './bookmarkSelection';
import { readBookmarkOpens } from './bookmarkOpens';

export function bookmarkAssortment(
  { identity, historyIdentity = identity, scope, period, shuffle, pool, settings },
  current = () => true,
) {
  return withLock('moo-bookmarks-selection', async () => {
    const saved = await readBookmarkCache('selection');
    const history =
      (saved?.historyIdentity || saved?.identity) === historyIdentity && saved.shown && saved.opened
        ? saved
        : { shown: {}, opened: {}, views: {} };
    const opens = readBookmarkOpens(historyIdentity);
    history.opened = { ...history.opened, ...opens.opened };
    history.openCounts = { ...history.openCounts, ...opens.counts };
    const views =
      history.views ||
      (history.scope
        ? {
            [history.scope]: { period: history.period, shuffle: history.shuffle, ids: history.ids },
          }
        : {});
    const previous = views[scope];
    const retained =
      !['latest', 'most_opened'].includes(settings.mode) &&
      previous?.period === period &&
      (!shuffle || previous.shuffle === shuffle) &&
      Array.isArray(previous.ids)
        ? previous.ids
            .map((id) => pool.find((item) => item.selectionKey === id))
            .filter(
              (item) =>
                item &&
                (!settings.hideOpened || !(history.opened[item.selectionKey] || item.openedAt)),
            )
        : [];
    const next = selectBookmarks(pool, settings, history, Date.now(), Math.random, retained).items;
    if (!current()) return [];
    const shown = { ...history.shown };
    for (const item of next)
      if (!retained.some((row) => row.selectionKey === item.selectionKey))
        shown[item.selectionKey] = Date.now();
    const trim = (values) =>
      Object.fromEntries(
        Object.entries(values)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20000),
      );
    views[scope] = {
      period,
      shuffle,
      ids: next.map((item) => item.selectionKey),
      touched: Date.now(),
    };
    await writeBookmarkCache('selection', {
      identity,
      historyIdentity,
      shown: trim(shown),
      opened: trim(history.opened),
      openCounts: Object.fromEntries(
        Object.keys(trim(history.opened)).map((key) => [key, history.openCounts[key] || 0]),
      ),
      views: Object.fromEntries(
        Object.entries(views)
          .sort((a, b) => (b[1].touched || 0) - (a[1].touched || 0))
          .slice(0, 20),
      ),
    });
    return next.map((item) => ({
      ...item,
      widgetOpenCount: history.openCounts[item.selectionKey] || 0,
    }));
  });
}
