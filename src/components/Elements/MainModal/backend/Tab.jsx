import { memo, useState, useEffect } from 'react';
import { useT } from 'contexts/TranslationContext';
import { getIconComponent, DIVIDER_LABELS } from '../constants/tabConfig';

function Tab({ label, currentTab, onClick, navbarTab }) {
  const t = useT();
  const [isExperimental, setIsExperimental] = useState(true);

  useEffect(() => {
    setIsExperimental(localStorage.getItem('experimental') !== 'false');
  }, []);

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
        {IconComponent && <IconComponent />} <span>{label}</span>
      </button>
      {hasDivider && <hr />}
    </>
  );
}

export default memo(Tab);
