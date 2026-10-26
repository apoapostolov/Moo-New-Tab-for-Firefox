import { useTranslationVersion } from 'contexts/TranslationContext';
import { MdOutlineKeyboardArrowRight } from 'react-icons/md';
import React from 'react';

function Section({ title, subtitle, icon, onClick, children }) {
  useTranslationVersion();
  return (
    <div className="moreSettings" onClick={onClick}>
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
        {icon}
        <div className="content">
          <span className="title">{title}</span>
          <span className="subtitle">{subtitle}</span>
        </div>
      </div>
      <div className="action">
        {React.Children.count(children) === 0 ? <MdOutlineKeyboardArrowRight /> : children}
      </div>
    </div>
  );
}

export { Section as default, Section };
