import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo, createElement } from 'react';
import { useT } from 'contexts/TranslationContext';
import { getIconComponent, DIVIDER_LABELS } from '../constants/tabConfig';

function Tab({ label, currentTab, onClick, navbarTab }) {
  useTranslationVersion();
  const t = useT();
  const isExperimental = localStorage.getItem('experimental') !== 'false';

  const IconComponent = getIconComponent(label, { getMessage: t });

  const hasDivider = DIVIDER_LABELS.some((key) => t(key) === label);

  const baseClass = navbarTab ? 'navbar-item' : 'tab-list-item';
  const activeClass = navbarTab ? 'navbar-item-active' : 'tab-list-active';
  const className = `${baseClass}${currentTab === label ? ` ${activeClass}` : ''}`;

  // The experimental tab is hidden unless experimental mode is on.
  const isExperimentalTab = label === t('modals.main.settings.sections.experimental.title');
  if (isExperimentalTab && !isExperimental) {
    return <hr />;
  }

  return (
    <>
      <button className={className} onClick={() => onClick(label)}>
        {IconComponent && createElement(IconComponent)} <span>{label}</span>
      </button>
      {hasDivider && <hr />}
    </>
  );
}

export default memo(Tab);
