import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState, memo, useRef, useEffect, useId } from 'react';
import { MdExpandMore, MdClose } from 'react-icons/md';

import './ChipSelect.scss';

function ChipSelect({ label, options, onChange, storageKey = 'apiCategories' }) {
  useTranslationVersion();
  const optionLabel = (value) =>
    options.find((option) => option.name === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1);

  let start = (localStorage.getItem(storageKey) || '').split(',');
  if (start[0] === '') {
    start = [];
  }

  const [optionsSelected, setOptionsSelected] = useState(start);
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionName) => {
    let newSelected;
    if (optionsSelected.includes(optionName)) {
      newSelected = optionsSelected.filter((item) => item !== optionName);
    } else {
      newSelected = [...optionsSelected, optionName];
    }

    setOptionsSelected(newSelected);
    localStorage.setItem(storageKey, newSelected.join(','));

    if (onChange) {
      onChange(newSelected);
    }
  };

  const handleRemoveChip = (e, optionName) => {
    e.stopPropagation();
    handleToggle(optionName);
  };

  return (
    <div
      className="chipSelect"
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          toggleRef.current.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      {label && <label className="chipSelect-label">{label}</label>}
      <div className="chipSelect-control">
        <div className="chipSelect-value">
          {optionsSelected.length === 0 ? (
            <span className="chipSelect-placeholder">{uiText('select_options_71c9fb')}</span>
          ) : (
            <div className="chipSelect-chips">
              {optionsSelected.map((value) => (
                <span key={value} className="chipSelect-chip">
                  {optionLabel(value)}
                  <button
                    type="button"
                    className="chipSelect-chip-remove"
                    aria-label={`Remove ${optionLabel(value)}`}
                    onClick={(e) => handleRemoveChip(e, value)}
                  >
                    <MdClose />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          ref={toggleRef}
          type="button"
          aria-label={label || 'Choose categories'}
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={() => setIsOpen(!isOpen)}
        >
          <MdExpandMore className={`chipSelect-arrow ${isOpen ? 'open' : ''}`} />
        </button>
      </div>
      {isOpen && (
        <div
          id={menuId}
          className="chipSelect-dropdown"
          role="group"
          aria-label={label || 'Categories'}
        >
          {options.map((option) => (
            <button
              type="button"
              aria-pressed={optionsSelected.includes(option.name)}
              key={option.name}
              className={`chipSelect-option ${optionsSelected.includes(option.name) ? 'selected' : ''}`}
              onClick={() => handleToggle(option.name)}
            >
              <span className="chipSelect-option-checkbox">
                {optionsSelected.includes(option.name) && '✓'}
              </span>
              <span className="chipSelect-option-label">
                {optionLabel(option.name)}
                {option.count && ` (${option.count})`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MemoizedChipSelect = memo(ChipSelect);
export { ChipSelect as default, MemoizedChipSelect as ChipSelect };
