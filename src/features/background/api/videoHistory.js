const LIMIT = 8;

export function readRecent(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberClip(storageKey, id) {
  localStorage.setItem(
    storageKey,
    JSON.stringify([id, ...readRecent(storageKey)].slice(0, LIMIT)),
  );
}

/**
 * Picks a clip that is not already on screen, so a refresh always changes the
 * video even when the source has no exclude parameter.
 */
export function pickUnseen(items, recent, keyOf) {
  return items.find((item) => {
    const key = keyOf(item);
    return Boolean(key) && !recent.includes(key);
  });
}
