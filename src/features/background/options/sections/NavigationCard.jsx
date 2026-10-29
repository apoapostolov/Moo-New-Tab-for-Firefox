import { useTranslationVersion } from 'contexts/TranslationContext';
import { MdOutlineKeyboardArrowRight } from 'react-icons/md';

const NavigationCard = ({ icon: Icon, title, subtitle, onClick, action, className = '' }) => {
  useTranslationVersion();
  return (
    <div
      className={`moreSettings ${className}${onClick ? '' : ' staticSettings'}`}
      onClick={
        onClick
          ? (event) => {
              if (!event.target.closest('.action')) onClick();
            }
          : undefined
      }
    >
      <div
        className="left"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? title : undefined}
        onKeyDown={
          onClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
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
