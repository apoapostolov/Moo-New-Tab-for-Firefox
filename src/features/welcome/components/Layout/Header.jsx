import { useTranslationVersion } from 'contexts/TranslationContext';

function Header({ title, subtitle, children }) {
  useTranslationVersion();
  return (
    <>
      <span className="mainTitle">{title}</span>
      <span className="subtitle">
        {subtitle}
        {subtitle && children ? ' ' : null}
        {children}
      </span>
    </>
  );
}

export { Header as default, Header };
