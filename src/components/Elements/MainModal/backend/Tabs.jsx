import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState, useEffect, useRef } from 'react';
import variables from 'config/variables';
import Tab from './Tab';
import { updateHash } from 'utils/deepLinking';
import ReminderInfo from '../components/ReminderInfo';
import ErrorBoundary from '../../../../features/misc/modals/ErrorBoundary';
import { TAB_TYPES } from '../constants/tabConfig';

const Tabs = ({
  children,
  navbar = false,
  currentTab: activeTab,
  onSectionChange,
  resetToFirst,
  deepLinkData,
  navigationTrigger,
  sections,
}) => {
  useTranslationVersion();

  // A deep link decides the initial section.
  const initialName =
    deepLinkData?.section && sections?.some((section) => section.name === deepLinkData.section)
      ? deepLinkData.section
      : children[0]?.props.name;
  const [currentName, setCurrentName] = useState(initialName);
  const [showReminder, setShowReminder] = useState(localStorage.getItem('showReminder') === 'true');
  const [previousTrigger, setPreviousTrigger] = useState(navigationTrigger);
  const [previousReset, setPreviousReset] = useState(resetToFirst);
  const contentRef = useRef(null);
  if (navigationTrigger !== previousTrigger) {
    setPreviousTrigger(navigationTrigger);
    if (
      navigationTrigger?.type === 'settings-section' &&
      children.some((child) => child.props.name === navigationTrigger.data)
    )
      setCurrentName(navigationTrigger.data);
  }
  if (resetToFirst !== previousReset) {
    setPreviousReset(resetToFirst);
    if (resetToFirst) setCurrentName(children[0]?.props.name);
  }
  const currentTab =
    children.find((child) => child.props.name === currentName)?.props.label ||
    children[0]?.props.label;
  const handleTabClick = (_label, name) => {
    if (name !== currentName) variables.stats.postEvent('tab', `Opened ${name}`);
    setCurrentName(name);
    updateHash(`#settings/${name}`);
  };
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    onSectionChange?.(currentTab, currentName);
  }, [currentTab, currentName, onSectionChange]);

  const handleHideReminder = () => {
    localStorage.setItem('showReminder', 'false');
    setShowReminder(false);
  };

  const showSidebar = activeTab === TAB_TYPES.SETTINGS;

  return (
    <div
      className="settingsTabs"
      style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {showSidebar && (
        <label className="compactSectionNav">
          {uiText('section_f2c6b5')}
          <select
            value={currentName}
            onChange={(event) => {
              const tab = children.find((child) => child.props.name === event.target.value);
              handleTabClick(tab.props.label, tab.props.name);
            }}
          >
            {children.map((tab) => (
              <option key={tab.props.name} value={tab.props.name}>
                {tab.props.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {showSidebar ? (
        <div className="modalSidebar">
          {children.map((tab, index) => (
            <Tab
              key={index}
              currentTab={currentTab}
              label={tab.props.label}
              onClick={(nextTab) => handleTabClick(nextTab, tab.props.name)}
              navbarTab={navbar}
            />
          ))}
          <ReminderInfo isVisible={showReminder} onHide={handleHideReminder} />
        </div>
      ) : null}
      <div className="modalTabContent" ref={contentRef}>
        {children.map((tab, index) => {
          if (tab.props.name !== currentName) {
            return null;
          }

          return (
            <ErrorBoundary key={`error-boundary-${index}`}>{tab.props.children}</ErrorBoundary>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
