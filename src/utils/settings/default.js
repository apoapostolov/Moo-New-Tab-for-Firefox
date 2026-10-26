import defaultSettings from 'utils/data/default_settings.json';

/**
 * Clears storage and applies the shipped defaults; `reset` also skips the
 * welcome page.
 */
export function setDefaultSettings(reset) {
  localStorage.clear();
  defaultSettings.forEach((element) => localStorage.setItem(element.name, element.value));

  if (reset) {
    localStorage.setItem('showWelcome', false);
  }

  // Prevents this running again on the next load.
  localStorage.setItem('firstRun', true);
}
