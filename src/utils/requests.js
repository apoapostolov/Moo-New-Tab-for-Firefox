import EventBus from './eventbus.js';
export function settingsStamp(match) {
  return JSON.stringify(
    Object.keys(localStorage)
      .filter((key) => match.test(key))
      .sort()
      .map((key) => [key, localStorage.getItem(key)]),
  );
}
export const online = () => localStorage.getItem('offlineMode') !== 'true';
let network = new AbortController();
const offlineChanged = () => {
  if (!online()) {
    network.abort();
    network = new AbortController();
  }
};
if (globalThis.document?.addEventListener) EventBus.on('refresh', offlineChanged);
if (globalThis.window?.addEventListener)
  window.addEventListener('storage', (event) => {
    if (event.key === 'offlineMode') offlineChanged();
  });
export function fetchWithTimeout(url, options = {}) {
  if (!online()) return Promise.reject(new Error('Moo is in offline mode.'));
  const timeout = AbortSignal.timeout(20000);
  const signal = AbortSignal.any([
    network.signal,
    timeout,
    ...(options.signal ? [options.signal] : []),
  ]);
  return fetch(url, { ...options, signal });
}
export function requestOwner() {
  let active;
  return {
    start() {
      active?.abort();
      active = new AbortController();
      const current = active;
      return {
        signal: current.signal,
        current: () => active === current && !current.signal.aborted && online(),
      };
    },
    cancel() {
      active?.abort();
    },
  };
}
let queue = Promise.resolve();
export function withLock(name, action) {
  if (globalThis.navigator?.locks) return navigator.locks.request(name, action);
  const next = queue.then(action, action);
  queue = next.catch(() => {});
  return next;
}
