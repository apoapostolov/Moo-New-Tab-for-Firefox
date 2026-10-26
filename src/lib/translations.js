import variables from 'config/variables';
import I18n from '@eartharoid/i18n';
const loaders = import.meta.glob('../i18n/locales/*.json');
const aliases = { pt_PT: 'pt' };
const loaded = new Map();
const loading = new Map();
export const localeCodes = Object.keys(loaders)
  .map((path) => path.split('/').pop().replace('.json', ''))
  .concat(Object.keys(aliases));
export const normalizeLocale = (locale) => {
  const exact = String(locale || 'en_GB').replaceAll('-', '_');
  return localeCodes.includes(exact) ? exact : 'en_GB';
};
async function loadLocale(locale) {
  if (aliases[locale]) return loadLocale(aliases[locale]);
  if (loaded.has(locale)) return loaded.get(locale);
  if (!loading.has(locale))
    loading.set(
      locale,
      loaders[`../i18n/locales/${locale}.json`]()
        .then((module) => {
          loaded.set(locale, module.default);
          loading.delete(locale);
          return module.default;
        })
        .catch((error) => {
          loading.delete(locale);
          throw error;
        }),
    );
  return loading.get(locale);
}
export async function initTranslations(locale) {
  const code = normalizeLocale(locale);
  const [fallback, selected] = await Promise.all([loadLocale('en_GB'), loadLocale(code)]);
  return new I18n('en_GB', { en_GB: fallback, [code]: selected });
}
let snapshot = { language: 'en_GB', instance: null };
const listeners = new Set();
let generation = 0;
export const translationSnapshot = () => snapshot;
export const subscribeTranslations = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
export async function selectLanguage(locale) {
  const current = ++generation;
  const language = normalizeLocale(locale);
  const instance = await initTranslations(language);
  if (current !== generation) return null;
  variables.language = instance;
  variables.languagecode = language;
  variables.getMessage = (key, optional = {}) => instance.getMessage(language, key, optional);
  snapshot = { language, instance };
  for (const callback of listeners) callback();
  return snapshot;
}

export const uiText = (key, optional = {}) => variables.getMessage(`ui.${key}`, optional);
