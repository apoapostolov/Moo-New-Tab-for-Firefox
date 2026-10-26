import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useT } from 'contexts/TranslationContext';
import { MdClose, MdChevronRight, MdArrowBack, MdArrowForward } from 'react-icons/md';
import { Tooltip } from 'components/Elements';
import { NAVBAR_BUTTONS } from '../constants/tabConfig';
import mueAboutIcon from 'assets/icons/mue_about.png';

const MARKETPLACE_TYPE_TO_KEY = {
  photo_packs: 'modals.main.marketplace.photo_packs',
  photos: 'modals.main.marketplace.photo_packs',
  quote_packs: 'modals.main.marketplace.quote_packs',
  quotes: 'modals.main.marketplace.quote_packs',
  preset_settings: 'modals.main.marketplace.preset_settings',
  settings: 'modals.main.marketplace.preset_settings',
  collections: 'modals.main.marketplace.collections',
  all: 'modals.main.marketplace.all',
};

function ModalTopBar({
  currentTab,
  currentSection,
  currentSectionName,
  currentSubSection,
  productView,
  iframeBreadcrumbs,
  onSubSectionChange,
  onClose,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
}) {
  useTranslationVersion();
  const t = useT();

  const currentTabButton = NAVBAR_BUTTONS.find(({ tab }) => tab === currentTab);
  const currentTabLabel = currentTabButton ? t(currentTabButton.messageKey) : '';

  const getSubSectionLabel = (subSection, sectionName) => {
    if (!subSection || !sectionName) return subSection;

    // Sections translate by passing the label as the key, so a missing key comes back unchanged.
    const translationKey = `modals.main.settings.sections.${sectionName}.${subSection}.title`;
    const translated = t(translationKey);

    if (!translated || translated === translationKey) {
      return subSection.charAt(0).toUpperCase() + subSection.slice(1);
    }

    return translated;
  };

  // Breadcrumb trail.
  const breadcrumbPath = [];

  if (currentTabLabel) {
    breadcrumbPath.push({
      label: currentTabLabel,
      onClick: productView ? productView.onBackToAll : null, // Clickable if viewing a product
    });

    // A Discover iframe sends its own trail: keep the section and take only the item name.
    if (iframeBreadcrumbs && iframeBreadcrumbs.length > 0) {
      const lastCrumb = iframeBreadcrumbs[iframeBreadcrumbs.length - 1];

      // Insert the section above the last crumb when it differs.
      if (currentSection && currentSection !== lastCrumb.label) {
        breadcrumbPath.push({
          label: currentSection,
          onClick: () => onBack(), // Clickable to go back
        });
      }

      breadcrumbPath.push({
        label: lastCrumb.label,
        onClick: null, // Current item - not clickable
      });
    } else if (productView) {
      // The collection page itself.
      if (productView.isCollection) {
        breadcrumbPath.push({
          label: productView.collectionTitle || productView.name,
          onClick: null, // Current page - not clickable
        });
      } else {
        if (productView.fromCollection && productView.collectionTitle) {
          breadcrumbPath.push({
            label: productView.collectionTitle,
            onClick: productView.onBack || null,
          });
        } else {
          const categoryKey = MARKETPLACE_TYPE_TO_KEY[productView.type];
          if (categoryKey) {
            breadcrumbPath.push({
              label: t(categoryKey),
              onClick: productView.onBack || null,
            });
          }
        }
        breadcrumbPath.push({
          label: productView.name,
          onClick: null, // Current item - not clickable
        });
      }
    } else if (currentSection) {
      // Settings: Tab > Section > Sub-Section.
      breadcrumbPath.push({
        label: currentSection,
        onClick: currentSubSection ? () => onSubSectionChange(null) : null, // Clickable if sub-section is active
      });

      if (currentSubSection) {
        breadcrumbPath.push({
          label: getSubSectionLabel(currentSubSection, currentSectionName),
          onClick: null, // Current sub-section - not clickable
        });
      }
    }
  }

  return (
    <div className="modalTopBar">
      <div className="topBarLeft">
        <div className="navigationButtons">
          <Tooltip title={uiText('back_b52b36')} key="backTooltip">
            <button
              className="navButton"
              onClick={onBack}
              disabled={!canGoBack}
              aria-label={uiText('navigate_back_dc4aac')}
            >
              <MdArrowBack />
            </button>
          </Tooltip>
          <Tooltip title={uiText('forward_ba4e72')} key="forwardTooltip">
            <button
              className="navButton"
              onClick={onForward}
              disabled={!canGoForward}
              aria-label={uiText('navigate_forward_7248fb')}
            >
              <MdArrowForward />
            </button>
          </Tooltip>
        </div>
        <img src={mueAboutIcon} alt="Moo" className="topBarLogo" draggable={false} />
        {breadcrumbPath.length > 0 && (
          <nav className="breadcrumbs" aria-label={uiText('breadcrumb_navigation_fceec8')}>
            {breadcrumbPath.map((item, index) => {
              const isLast = index === breadcrumbPath.length - 1;
              const isClickable = item.onClick !== null;

              return (
                <span key={index} className="breadcrumb-segment">
                  {isClickable ? (
                    <span
                      className={`breadcrumb-item breadcrumb-clickable`}
                      onClick={item.onClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          item.onClick();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Navigate to ${item.label}`}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <span
                      className={`breadcrumb-item ${isLast ? 'breadcrumb-current' : ''}`}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && (
                    <MdChevronRight className="breadcrumb-separator" aria-hidden="true" />
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>
      <div className="topBarRight">
        <Tooltip title={t('modals.welcome.buttons.close')} key="closeTooltip">
          <button
            type="button"
            className="closeModal"
            onClick={onClose}
            aria-label={t('modals.welcome.buttons.close')}
          >
            <MdClose />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export default ModalTopBar;
