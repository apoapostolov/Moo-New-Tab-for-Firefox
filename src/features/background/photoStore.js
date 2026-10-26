import { useSyncExternalStore } from 'react';

/**
 * Current background photo, published so the Image Info widget can draw the
 * credit anywhere on the page. The snapshot is replaced, never mutated, so React
 * can compare it by identity.
 */
const EMPTY = { photoInfo: null, api: '', url: '' };

let snapshot = EMPTY;
const listeners = new Set();

export function setCurrentPhoto({ photoInfo, api, url }) {
  const next = { photoInfo: photoInfo || null, api: api || '', url: url || '' };

  if (
    next.photoInfo === snapshot.photoInfo &&
    next.api === snapshot.api &&
    next.url === snapshot.url
  ) {
    return;
  }

  snapshot = next;

  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};

export const useCurrentPhoto = () => useSyncExternalStore(subscribe, () => snapshot);
