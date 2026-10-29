import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { selectLanguage, subscribeTranslations, translationSnapshot } from 'lib/translations';
import variables from 'config/variables';
import EventBus from 'utils/eventbus';
const TranslationContext = createContext();
export function useTranslationVersion() {
  return useSyncExternalStore(subscribeTranslations, translationSnapshot, translationSnapshot);
}
export function TranslationProvider({ children }) {
  const { language, instance } = useTranslationVersion();
  const changeLanguage = useCallback(async (newLanguage) => {
    const oldDefault = variables.getMessage('tabname');
    try {
      const result = await selectLanguage(newLanguage);
      if (!result) return;
      variables.language = result.instance;
      variables.languagecode = result.language;
      document.documentElement.lang = result.language.replaceAll('_', '-');
      localStorage.setItem('language', result.language);
      const tabName = localStorage.getItem('tabName');
      if (!tabName || tabName === oldDefault) {
        const name = result.instance.getMessage(result.language, 'tabname');
        localStorage.setItem('tabName', name);
        document.title = name;
      }
      localStorage.removeItem('currentWeather');
      EventBus.emit('refresh', 'clock');
      EventBus.emit('refresh', 'weather');
    } catch (error) {
      console.error('The language could not be loaded:', error);
    }
  }, []);
  const t = useCallback(
    (key, optional = {}) => instance?.getMessage(language, key, optional) ?? key,
    [language, instance],
  );
  useEffect(() => {
    const handler = (data) => {
      if (data?.language) changeLanguage(data.language);
    };
    EventBus.on('languageChange', handler);
    return () => EventBus.off('languageChange', handler);
  }, [changeLanguage]);
  const value = useMemo(
    () => ({ language, languagecode: language, changeLanguage, t }),
    [language, changeLanguage, t],
  );
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within a TranslationProvider');
  return context;
}
export const useT = () => useTranslation().t;
