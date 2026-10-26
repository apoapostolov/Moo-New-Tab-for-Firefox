import { useTranslationVersion } from 'contexts/TranslationContext';
import { TAB_TYPES } from '../constants/tabConfig';

// Divider positions mirror the real sidebar per tab.
const TAB_CONFIGS = {
  [TAB_TYPES.SETTINGS]: {
    itemCount: 16, // Excluding experimental
    dividerPositions: [10, 12], // After Weather, Language
    textWidths: [80, 100, 70, 90, 85, 75, 80, 95, 90, 75, 85, 90, 85, 80, 70, 95], // Fixed widths in pixels
  },
};

const SidebarSkeleton = ({ currentTab = TAB_TYPES.SETTINGS }) => {
  useTranslationVersion();
  const config = TAB_CONFIGS[currentTab] || TAB_CONFIGS[TAB_TYPES.SETTINGS];

  // The Library tab has no sidebar.
  if (config.itemCount === 0) {
    return null;
  }

  return (
    <div className="sidebarSkeleton">
      {Array.from({ length: config.itemCount }).map((_, index) => {
        const hasDivider = config.dividerPositions.includes(index);
        const textWidth = config.textWidths[index] || 80;

        return (
          <div key={index}>
            <div className="skeletonItem">
              <div className="iconPlaceholder pulse" />
              <div className="textPlaceholder pulse" style={{ width: `${textWidth}px` }} />
            </div>
            {hasDivider && <hr className="skeletonDivider" />}
          </div>
        );
      })}
    </div>
  );
};

export default SidebarSkeleton;
