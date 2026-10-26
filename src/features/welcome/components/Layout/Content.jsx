import { useTranslationVersion } from 'contexts/TranslationContext';
const Content = ({ children }) => {
  useTranslationVersion();
  return <div className="content">{children}</div>;
};

export { Content as default, Content };
