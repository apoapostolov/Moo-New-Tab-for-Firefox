import { safeBookmarkUrl } from './bookmarkSelection';
import { clearBookmarkCache } from './bookmarkCache';

const extension = () =>
  globalThis.browser?.permissions || globalThis.browser?.bookmarks
    ? globalThis.browser
    : globalThis.chrome;
let revision = 0;
export const browserBookmarkRevision = () => revision;

export async function browserBookmarkAccess() {
  const api = extension();
  if (!api?.permissions && !api?.bookmarks?.getTree) return 'unavailable';
  if (api.permissions?.contains) {
    try {
      if (!(await api.permissions.contains({ permissions: ['bookmarks'] }))) return 'permission';
    } catch {
      return 'permission';
    }
  }
  return api.bookmarks?.getTree ? 'granted' : 'unavailable';
}

/** Call directly from the click handler so Firefox retains its user gesture. */
export async function requestBrowserBookmarkAccess() {
  const api = extension();
  if (!api?.permissions?.request) throw new Error('unavailable');
  return api.permissions.request({ permissions: ['bookmarks'] });
}

const timestamp = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

/** Iterative traversal supports large libraries without recursion limits or URL lookups. */
export function flattenBrowserBookmarks(tree) {
  const items = [],
    folders = [];
  const stack = (Array.isArray(tree) ? tree : [])
    .map((node) => ({ node, path: [], parents: [] }))
    .reverse();
  while (stack.length) {
    const { node, path, parents } = stack.pop();
    if (!node || node.type === 'separator') continue;
    if (typeof node.url === 'string') {
      const url = safeBookmarkUrl(node.url);
      if (!url || node.id == null) continue;
      items.push({
        key: `browser:${node.id}`,
        source: 'browser',
        title: String(node.title || new URL(url).hostname).slice(0, 1000),
        url,
        readerUrl: '',
        cover: '',
        description: '',
        note: '',
        tags: [],
        type: 'link',
        author: '',
        collection: path.join(' / '),
        folderId: parents.at(-1) || '',
        folderAncestors: parents,
        created: timestamp(node.dateAdded),
        updated: timestamp(node.dateAdded),
        minutes: 0,
        progress: null,
        favorite: false,
        openedAt: timestamp(node.dateLastUsed),
      });
      continue;
    }
    if (!Array.isArray(node.children)) continue;
    // Synthetic roots have no parent. Browser-owned folders below them remain selectable.
    const isRoot = node.parentId == null && !parents.length;
    const title = String(node.title || '').trim();
    const nextPath = isRoot ? path : [...path, title || String(node.id)];
    const nextParents = isRoot ? parents : [...parents, String(node.id)];
    if (!isRoot) folders.push({ id: String(node.id), title: nextPath.join(' / ') });
    for (let index = node.children.length - 1; index >= 0; index--)
      stack.push({ node: node.children[index], path: nextPath, parents: nextParents });
  }
  return { items, folders };
}

/** The browser already owns the index; keep this snapshot in memory, not another database. */
export async function readBrowserBookmarks(config = {}, signal) {
  const generation = revision;
  signal?.throwIfAborted();
  const access = await browserBookmarkAccess();
  signal?.throwIfAborted();
  if (access !== 'granted')
    return { items: [], collections: [], complete: true, updated: 0, error: access };
  let tree;
  try {
    tree = await extension().bookmarks.getTree();
  } catch {
    signal?.throwIfAborted();
    const next = await browserBookmarkAccess();
    return {
      items: [],
      collections: [],
      complete: true,
      updated: 0,
      error: next === 'granted' ? 'browser' : next,
    };
  }
  signal?.throwIfAborted();
  if (generation !== revision) throw new DOMException('Bookmarks changed', 'AbortError');
  const { items, folders } = flattenBrowserBookmarks(tree);
  if (config.folder && !folders.some((folder) => folder.id === config.folder))
    return {
      items: [],
      collections: folders,
      complete: true,
      updated: Date.now(),
      error: 'folder',
    };
  const words = String(config.query || '')
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return {
    items: items.filter(
      (item) =>
        (!config.folder ||
          (config.nested !== false
            ? item.folderAncestors.includes(config.folder)
            : item.folderId === config.folder)) &&
        words.every((word) =>
          `${item.title} ${item.url} ${item.collection}`.toLocaleLowerCase().includes(word),
        ),
    ),
    collections: folders,
    complete: true,
    updated: Date.now(),
    error: null,
  };
}

/** Coalesce bookmark imports and bursts of edits; permission revocation clears discovery data. */
export function subscribeBrowserBookmarks(onChange) {
  const api = extension();
  if (!api) return () => {};
  let timer,
    importing = false,
    disposed = false;
  const bookmarkListeners = [];
  const unbind = () => {
    for (const [event, listener] of bookmarkListeners.splice(0)) event.removeListener(listener);
  };
  const notify = () => {
    clearTimeout(timer);
    if (!importing) timer = setTimeout(onChange, 120);
  };
  const changed = () => {
    revision++;
    notify();
  };
  const bind = () => {
    unbind();
    for (const name of ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered']) {
      const event = api.bookmarks?.[name];
      if (event?.addListener) {
        event.addListener(changed);
        bookmarkListeners.push([event, changed]);
      }
    }
    const began = () => {
      importing = true;
      clearTimeout(timer);
      revision++;
    };
    const ended = () => {
      importing = false;
      changed();
    };
    for (const [event, listener] of [
      [api.bookmarks?.onImportBegan, began],
      [api.bookmarks?.onImportEnded, ended],
    ])
      if (event?.addListener) {
        event.addListener(listener);
        bookmarkListeners.push([event, listener]);
      }
  };
  const permissionChanged = (permissions) => {
    if (!permissions.permissions?.includes('bookmarks')) return;
    revision++;
    importing = false;
    bind();
    clearBookmarkCache('browser')
      .catch(() => {})
      .finally(() => {
        if (!disposed) onChange();
      });
  };
  bind();
  api.permissions?.onAdded?.addListener(permissionChanged);
  api.permissions?.onRemoved?.addListener(permissionChanged);
  return () => {
    disposed = true;
    clearTimeout(timer);
    unbind();
    api.permissions?.onAdded?.removeListener(permissionChanged);
    api.permissions?.onRemoved?.removeListener(permissionChanged);
  };
}
