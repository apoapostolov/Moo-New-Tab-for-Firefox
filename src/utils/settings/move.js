import defaultSettings from '../data/default_settings.json';

const retiredWelcomeKeys = ['showWelcome', 'welcomePreview', 'welcomeTab', 'welcomeImage'];

/** Fill missing settings without resetting an existing profile. */
export function moveSettings() {
  for (const { name, value } of defaultSettings) {
    if (localStorage.getItem(name) === null) localStorage.setItem(name, value);
  }
  for (const key of retiredWelcomeKeys) localStorage.removeItem(key);
}
