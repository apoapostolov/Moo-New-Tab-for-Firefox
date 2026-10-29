const DATABASE = 'moo-bookmarks';
const STORE = 'state';

async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(new Error('storage'));
    request.onsuccess = () => resolve(request.result);
  });
}

async function access(mode, action) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request?.result);
      transaction.onerror = transaction.onabort = () => reject(new Error('storage'));
    });
  } finally {
    db.close();
  }
}

export const readBookmarkCache = (key) => access('readonly', (store) => store.get(key));
export const writeBookmarkCache = (key, value) =>
  access('readwrite', (store) => store.put(value, key));
export const clearBookmarkCache = (source) => {
  localStorage.removeItem('bookmarksOpenCache');
  return access('readwrite', (store) => {
    if (!source) return store.clear();
    if (source === 'raindrop') store.delete('collections');
    if (['browser', 'raindrop', 'readwise'].includes(source)) store.delete('selection');
    return store.delete(source);
  });
};
