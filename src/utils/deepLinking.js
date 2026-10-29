/**
 * Deep-link hashes that open a tab, an item or a settings section from a URL.
 */

import { TAB_TYPES } from '../components/Elements/MainModal/constants/tabConfig';

/**
 * Parses `#tab[/section[/subSection[/itemId]]]`. `marketplace` aliases to
 * `discover`, which also reads `discover/collection/<name>[/<itemId>]` and
 * `discover/<category>/<itemId>`.
 */
export const parseDeepLink = (hash = window.location.hash) => {
  if (!hash || hash === '#') {
    return null;
  }

  const path = hash.slice(1);
  const parts = path.split('/');

  const result = {
    tab: parts[0],
    section: parts[1],
    subSection: parts[2],
    itemId: parts[3],
  };

  // `marketplace` survives in links published by an older build.
  if (result.tab === 'marketplace') {
    result.tab = 'discover';
  }

  const validTabs = Object.values(TAB_TYPES);
  if (!validTabs.includes(result.tab)) {
    return null;
  }

  if (result.tab === 'settings') {
    // Older links still reach the Countdown widget controls in Floats.
    if (result.section === 'countdown') result.section = 'floats';
    // A third part is a sub-section, never an item id.
    if (result.subSection && !result.itemId) {
      result.itemId = null;
    } else if (!result.subSection) {
      result.subSection = null;
    }
  }

  if (result.tab === 'discover') {
    if (result.section === 'collection') {
      result.collection = result.subSection;
      // A 4th part is the item id within the collection.
      if (result.itemId) {
        result.fromCollection = true;
      } else {
        result.itemId = null;
      }
    } else if (['preset_settings', 'photo_packs', 'quote_packs', 'all'].includes(result.section)) {
      result.category = result.section;
      // The third part landed in subSection; here it is the item id.
      if (result.subSection) {
        result.itemId = result.subSection;
        result.subSection = null;
      }
    } else if (result.section && !result.subSection) {
      result.itemId = result.section;
      result.section = null;
    }
  }

  return result;
};

/**
 * Builds the hash `parseDeepLink` reads back. An item only keeps its collection
 * when `fromCollection` is set.
 */
export const createDeepLink = (tab, options = {}) => {
  let hash = `#${tab}`;

  if (tab === 'discover') {
    if (options.collection && options.itemId && options.fromCollection) {
      hash += `/collection/${options.collection}/${options.itemId}`;
    } else if (options.collection) {
      hash += `/collection/${options.collection}`;
    } else if (options.itemId && options.category) {
      hash += `/${options.category}/${options.itemId}`;
    } else if (options.itemId) {
      hash += `/${options.itemId}`;
    } else if (options.category) {
      hash += `/${options.category}`;
    }
  } else if (options.section) {
    hash += `/${options.section}`;
    if (options.subSection) {
      hash += `/${options.subSection}`;
    }
  }

  return hash;
};

/**
 * Writes the hash without a reload; `pushToHistory` false replaces the entry.
 */
export const updateHash = (hash, pushToHistory = true) => {
  if (window.history.pushState) {
    if (pushToHistory) {
      window.history.pushState(null, null, hash);
    } else {
      window.history.replaceState(null, null, hash);
    }
  } else {
    window.location.hash = hash;
  }
};

/**
 * Calls back on every hashchange; returns an unsubscribe function.
 */
export const onHashChange = (callback) => {
  const handler = () => {
    const deepLink = parseDeepLink();
    if (deepLink) {
      callback(deepLink);
    }
  };

  window.addEventListener('hashchange', handler);

  return () => window.removeEventListener('hashchange', handler);
};

/**
 * True when the page loaded with a hash that parses as a deep link.
 */
export const shouldAutoOpenModal = () => {
  const deepLink = parseDeepLink();
  return deepLink !== null;
};

/**
 * Resolves a legacy item name to its id through the API; null when unknown.
 */
export const resolveItemNameToId = async (category, name, apiUrl) => {
  try {
    const response = await fetch(`${apiUrl}/v2/marketplace/item/${category}/${name}`);
    const data = await response.json();
    return data?.data?.id || null;
  } catch (error) {
    console.error('Failed to resolve item name to ID:', error);
    return null;
  }
};
