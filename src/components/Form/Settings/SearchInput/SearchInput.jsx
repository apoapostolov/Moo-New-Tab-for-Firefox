import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo } from 'react';
import { MdSearch } from 'react-icons/md';

import './SearchInput.scss';

const SearchInput = memo(({ value, onChange, placeholder, fullWidth }) => {
  useTranslationVersion();
  return (
    <div className={`search-input-container${fullWidth ? ' full-width' : ''}`}>
      <MdSearch className="search-input-icon" />
      <input
        type="text"
        className="search-input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder || 'Search'}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export { SearchInput as default, SearchInput };
