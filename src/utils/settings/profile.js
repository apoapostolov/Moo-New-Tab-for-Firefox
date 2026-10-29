import { clearBookmarkCache } from '../../features/bookmarks/bookmarkCache';
import { flushDrafts } from '../durableWriter';
import defaults from '../data/default_settings.json';
import {
  beginProfileChange,
  finishProfileChange,
  readProfileChange,
  rollbackProfileAssets,
} from '../customBackgroundDB';
import { isCredential } from './backupSchema';
const snapshot = () =>
  Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]));
function writeStorage(values) {
  for (const key of Object.keys(localStorage)) if (!(key in values)) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
}
let pending = Promise.resolve();
export function withProfileLock(action) {
  if (globalThis.navigator?.locks) return navigator.locks.request('moo-profile-write', action);
  const next = pending.then(action, action);
  pending = next.catch(() => {});
  return next;
}
export async function recoverProfileChange() {
  const previous = await readProfileChange();
  if (!previous) return false;
  writeStorage(previous.storage);
  await rollbackProfileAssets();
  return true;
}
export function changeProfile(makeSettings, backgrounds, scratchImages) {
  return withProfileLock(async () => {
    flushDrafts();
    await recoverProfileChange();
    const previous = snapshot();
    const next = makeSettings(previous);
    await beginProfileChange(previous, backgrounds, scratchImages);
    try {
      writeStorage({ ...next, profileRevision: `${Date.now()}-${Math.random()}` });
      await clearBookmarkCache();
      await finishProfileChange();
    } catch (error) {
      try {
        writeStorage(previous);
        await rollbackProfileAssets();
      } catch {
        throw new Error('The change could not finish. Reload Moo to recover your previous data.');
      }
      throw error;
    }
  });
}
const personal = new Set([
  'quicklinks',
  'focusQuicklinks',
  'applinks',
  'todo',
  'notes',
  'scratchNotesData',
  'scratchImagesData',
  'scratchTopZ',
  'rssFeeds',
  'portfolioHoldings',
  'habitsData',
  'countdowns',
  'worldClocks',
  'liveChannels',
  'favourite',
]);
export async function resetProfile(erase = false) {
  if (erase && globalThis.browser?.storage?.local) await browser.storage.local.remove('googleAuth');
  return changeProfile(
    (previous) => ({
      ...Object.fromEntries(defaults.map(({ name, value }) => [name, String(value)])),
      ...Object.fromEntries(
        Object.entries(previous).filter(
          ([key]) =>
            !erase &&
            (personal.has(key) || isCredential(key) || key.startsWith('customBackground')),
        ),
      ),
      firstRun: 'true',
      customBackgroundMigrated: 'true',
    }),
    erase ? [] : undefined,
    erase ? [] : undefined,
  );
}
