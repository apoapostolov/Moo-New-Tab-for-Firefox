export const readQuicklinks = (storageKey = 'quicklinks') => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Failed to parse quicklinks from localStorage. Resetting to []', e);
    return [];
  }
};

export const quicklinksStorageKey = (focused) =>
  focused && localStorage.getItem('quicklinksSeparateFocus') === 'true'
    ? 'focusQuicklinks'
    : 'quicklinks';
