import { useTranslationVersion } from 'contexts/TranslationContext';
import { MdOutlineKeyboardArrowRight } from 'react-icons/md';

const NavigationCard = ({ icon: Icon, title, subtitle, onClick, action }) => {
  useTranslationVersion();
  return (
    <div
      className="moreSettings"
      onClick={(event) => {
        if (!event.target.closest('.action')) onClick();
      }}
    >
      <div
        className="left"
        role="button"
        tabIndex={0}
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        <Icon />
        <div className="content">
          <span className="title">{title}</span>
          <span className="subtitle">{subtitle}</span>
        </div>
      </div>
      <div className="action">{action || <MdOutlineKeyboardArrowRight />}</div>
    </div>
  );
};

export default NavigationCard;
