import { setDefaultSettings } from './default';

/**
 * Resets to defaults, then restores every stored key that still exists.
 */
export function moveSettings() {
  const currentSettings = Object.keys(localStorage);
  if (currentSettings.length === 0) {
    return setDefaultSettings();
  }

  const settings = {};
  currentSettings.forEach((key) => {
    settings[key] = localStorage.getItem(key);
  });

  localStorage.clear();
  setDefaultSettings();

  Object.keys(settings).forEach((key) => {
    localStorage.setItem(key, settings[key]);
  });
}
