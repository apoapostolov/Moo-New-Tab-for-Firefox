import { useSyncExternalStore } from 'react';
export const COMPACT_LAYOUT = '(max-width: 1100px), (max-height: 600px)';
const subscribe = (callback) => {
  const query = window.matchMedia(COMPACT_LAYOUT);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};
export default function useCompactLayout() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COMPACT_LAYOUT).matches,
    () => false,
  );
}
