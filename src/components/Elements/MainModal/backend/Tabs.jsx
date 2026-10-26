import { useState, useEffect, useRef } from 'react';
import { useT } from 'contexts/TranslationContext';
import variables from 'config/variables';
import Tab from './Tab';
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
  const t = useT();

  // A deep link decides the initial section.
  const getInitialSection = () => {
    if (deepLinkData?.section && sections) {
      const section = sections.find((s) => s.name === deepLinkData.section);
      if (section) {
        return {
          label: t(section.label),
          name: section.name,
        };
      }
    }
    return {
      label: children[0]?.props.label,
      name: children[0]?.props.name,
    };
  };

  const initial = getInitialSection();
  const [currentTab, setCurrentTab] = useState(initial.label);
  const [currentName, setCurrentName] = useState(initial.name);
  const [showReminder, setShowReminder] = useState(localStorage.getItem('showReminder') === 'true');
  const contentRef = useRef(null);

  const handleTabClick = (tab, name) => {
    if (name !== currentName) {
      variables.stats.postEvent('tab', `Opened ${name}`);
    }

    setCurrentTab(tab);
    setCurrentName(name);

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    if (onSectionChange) {
      onSectionChange(tab, name);
    }
  };

  useEffect(() => {
    if (onSectionChange && currentTab) {
      onSectionChange(currentTab, currentName);
    }
  }, []);

  // Section labels follow the UI language.
  useEffect(() => {
    if (sections && currentName) {
      const section = sections.find((s) => s.name === currentName);
      if (section) {
        const newLabel = t(section.label);
        setCurrentTab(newLabel);
      }
    }
  }, [t, sections, currentName]);

  // Back and forward re-drive the section from the hash.
  useEffect(() => {
    if (navigationTrigger?.type === 'settings-section' && sections) {
      const section = sections.find((s) => s.name === navigationTrigger.data);
      if (section) {
        const label = t(section.label);
        setCurrentTab(label);
        setCurrentName(section.name);
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }
    }
  }, [navigationTrigger, sections, t]);

  useEffect(() => {
    if (resetToFirst) {
      setCurrentTab(children[0]?.props.label);
      setCurrentName(children[0]?.props.name);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      if (onSectionChange) {
        onSectionChange(children[0]?.props.label, children[0]?.props.name);
      }
    }
  }, [resetToFirst]);

  const handleHideReminder = () => {
    localStorage.setItem('showReminder', 'false');
    setShowReminder(false);
  };

  const showSidebar = activeTab === TAB_TYPES.SETTINGS;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
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
          if (tab.props.label !== currentTab) {
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
