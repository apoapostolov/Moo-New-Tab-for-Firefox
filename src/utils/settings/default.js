import defaultSettings from 'utils/data/default_settings.json';

/** Replace preferences with the ready-to-use default profile. */
export function setDefaultSettings() {
  localStorage.clear();
  for (const { name, value } of defaultSettings) localStorage.setItem(name, value);
}
