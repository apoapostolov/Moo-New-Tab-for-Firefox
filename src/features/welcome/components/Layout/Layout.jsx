import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
function Layout() {
  useTranslationVersion();
  return <h1>{uiText('cheese_d48b39')}</h1>;
}

export { Layout as default, Layout };
