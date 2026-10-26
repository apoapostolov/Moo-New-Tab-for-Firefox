/**
 * IndexedDB store for custom background images, which localStorage cannot hold.
 */

const DB_NAME = 'MooCustomBackgrounds';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

/**
 * Opens the database, creating the store on first run.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        objectStore.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

/**
 * Every stored background, oldest first.
 */
export async function getAllBackgroundsWithMetadata() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result;
        // Rows written before the object format are bare URLs.
        resolve(
          results.map((item) => {
            if (typeof item.url === 'string' && !item.name) {
              return {
                id: item.id,
                url: item.url,
                name: `Image ${item.id}`,
                uploadDate: item.createdAt || Date.now(),
                dimensions: null,
                fileSize: null,
                folder: '',
                blurHash: null,
              };
            }
            return item;
          }),
        );
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting backgrounds from IndexedDB:', error);
    return [];
  }
}

/**
 * Stored image URLs, oldest first.
 */
export async function getAllBackgrounds() {
  const backgrounds = await getAllBackgroundsWithMetadata();
  return backgrounds.map((bg) => bg.url || bg);
}

/**
 * Stores a background and returns its id.
 */
export async function addBackground(backgroundData) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  // Legacy string rows.
  const data =
    typeof backgroundData === 'string'
      ? { url: backgroundData, name: 'Image', uploadDate: Date.now(), folder: '' }
      : { ...backgroundData, uploadDate: backgroundData.uploadDate || Date.now() };

  const request = store.add(data);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Replaces the background at a 0-based index.
 */
export async function updateBackground(index, backgroundData) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const getAllRequest = store.getAll();

  return new Promise((resolve, reject) => {
    getAllRequest.onsuccess = () => {
      const items = getAllRequest.result;
      if (items[index]) {
        const item = items[index];

        // Legacy string input.
        if (typeof backgroundData === 'string') {
          item.url = backgroundData;
        } else {
          Object.assign(item, backgroundData);
        }
        item.updatedAt = Date.now();

        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        addBackground(backgroundData).then(resolve).catch(reject);
      }
    };
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
}

/**
 * Deletes the background at a 0-based index.
 */
export async function deleteBackground(index) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const getAllRequest = store.getAll();

  return new Promise((resolve, reject) => {
    getAllRequest.onsuccess = () => {
      const items = getAllRequest.result;
      if (items[index]) {
        const deleteRequest = store.delete(items[index].id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        resolve(); // Index doesn't exist, nothing to delete
      }
    };
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
}

/**
 * Deletes every background at the given 0-based indices.
 */
export async function deleteMultipleBackgrounds(indices) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const getAllRequest = store.getAll();

  return new Promise((resolve, reject) => {
    getAllRequest.onsuccess = () => {
      const items = getAllRequest.result;
      const idsToDelete = indices.filter((index) => items[index]).map((index) => items[index].id);

      let completed = 0;
      const total = idsToDelete.length;

      if (total === 0) {
        resolve();
        return;
      }

      idsToDelete.forEach((id) => {
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    };
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
}

/**
 * Empties the store.
 */
export async function clearAllBackgrounds() {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Number of stored backgrounds.
 */
export async function getBackgroundCount() {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.count();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Merges metadata into the background with that id.
 */
export async function updateBackgroundMetadata(id, metadata) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        Object.assign(item, metadata);
        item.updatedAt = Date.now();
        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Background not found'));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Moves backgrounds out of localStorage once; true when it ran.
 */
export async function migrateFromLocalStorage() {
  try {
    const stored = localStorage.getItem('customBackground');
    if (!stored || stored === 'null' || stored === '[]') {
      return false;
    }

    let backgrounds = [];
    try {
      backgrounds = JSON.parse(stored);
      if (!Array.isArray(backgrounds)) {
        backgrounds = [stored];
      }
    } catch (e) {
      backgrounds = [stored];
    }

    // Filter out null/empty values
    backgrounds = backgrounds.filter((bg) => bg && bg.trim() !== '');

    if (backgrounds.length === 0) {
      return false;
    }

    const count = await getBackgroundCount();
    if (count > 0) {
      return false; // Already migrated
    }

    for (const bg of backgrounds) {
      await addBackground(bg);
    }

    console.log(`Migrated ${backgrounds.length} backgrounds from localStorage to IndexedDB`);

    // Kept as a backup; the mark stops the migration from running twice.
    localStorage.setItem('customBackgroundMigrated', 'true');

    return true;
  } catch (error) {
    console.error('Error migrating backgrounds:', error);
    return false;
  }
}
