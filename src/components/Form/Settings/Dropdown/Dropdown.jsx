import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { memo, useState, useCallback, useRef, useEffect, useId, useContext } from 'react';
import { RowLabelContext } from 'components/Layout/Settings/Item/SettingsItem';
import { MdExpandMore, MdCheck, MdRefresh } from 'react-icons/md';
import { toast } from 'react-toastify';

import EventBus from 'utils/eventbus';

import './Dropdown.scss';

const Dropdown = memo((props) => {
  useTranslationVersion();
  const rowLabel = useContext(RowLabelContext);
  const [value, setValue] = useState(localStorage.getItem(props.name) || props.items[0]?.value);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [opensUp, setOpensUp] = useState(false);
  const containerRef = useRef(null);
  const optionsRef = useRef([]);
  const menuId = useId();
  const items = props.items.filter(Boolean);

  /**
   * A dropdown near the bottom of a pane has no room below it: measure against the nearest
   * scrolling ancestor and flip the menu upwards when that is where the space is.
   */
  const measureDirection = useCallback(() => {
    const control = containerRef.current?.querySelector('.dropdown-control');

    if (!control) return false;

    const rect = control.getBoundingClientRect();
    let bounds = { top: 0, bottom: window.innerHeight };
    let pane = null;
    let parent = control.parentElement;

    // Every clipping ancestor has a say: the scrolling pane, but also the rounded frame
    // around it.
    while (parent) {
      const style = window.getComputedStyle(parent);
      const clips = /(auto|scroll|hidden|clip)/.test(style.overflowY);

      if (clips) {
        const box = parent.getBoundingClientRect();

        bounds = {
          top: Math.max(bounds.top, box.top),
          bottom: Math.min(bounds.bottom, box.bottom),
        };

        if (!pane && /(auto|scroll)/.test(style.overflowY)) pane = parent;
      }

      parent = parent.parentElement;
    }

    const rows = props.items.filter(Boolean).length;
    const needed = Math.min(rows * 34 + 12, 250);
    const below = bounds.bottom - rect.bottom - 8;
    const above = rect.top - bounds.top - 8;

    // Opens upwards when it cannot fit below, or when the control is one of the last rows and
    // the list ends directly under it. Room above is required either way.
    const contentBelow = pane
      ? pane.scrollHeight - (pane.scrollTop + rect.bottom - bounds.top)
      : needed;

    return above >= needed && (below < needed || contentBelow < needed);
  }, [props.items]);

  const openMenu = useCallback(() => {
    setOpensUp(measureDirection());
    setFocusedIndex(
      Math.max(
        0,
        props.items.filter(Boolean).findIndex((item) => item.value === value),
      ),
    );
    setIsOpen(true);
  }, [measureDirection, props.items, value]);

  useEffect(() => {
    if (isOpen) optionsRef.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, focusedIndex]);

  // Re-check while the pane scrolls or the window resizes.
  useEffect(() => {
    if (!isOpen) return undefined;

    const remeasure = () => setOpensUp(measureDirection());

    document.addEventListener('scroll', remeasure, true);
    window.addEventListener('resize', remeasure);

    return () => {
      document.removeEventListener('scroll', remeasure, true);
      window.removeEventListener('resize', remeasure);
    };
  }, [isOpen, measureDirection]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onChange = useCallback(
    (newValue) => {
      if (newValue === variables.getMessage('modals.main.loading')) {
        return;
      }

      variables.stats.postEvent('setting', `${props.name} from ${value} to ${newValue}`);

      setValue(newValue);
      setIsOpen(false);
      setFocusedIndex(-1);

      if (!props.noSetting) {
        localStorage.setItem(props.name, newValue);
        if (props.name2) localStorage.setItem(props.name2, props.value2);
      }

      if (props.onChange) {
        props.onChange(newValue);
      }

      if (props.element) {
        if (!document.querySelector(props.element)) {
          document.querySelector('.reminder-info').style.display = 'flex';
          return localStorage.setItem('showReminder', true);
        }
      }

      EventBus.emit('refresh', props.category);
    },
    [value, props],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (props.disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && items[focusedIndex]) onChange(items[focusedIndex].value);
          else openMenu();
          break;
        case 'Escape':
          if (isOpen) e.stopPropagation();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            openMenu();
          } else {
            setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
          }
          break;
        case 'Home':
        case 'End':
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(e.key === 'Home' ? 0 : items.length - 1);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;
      }
    },
    [isOpen, items, focusedIndex, props.disabled, openMenu, onChange],
  );

  const handleOptionKeyDown = useCallback(
    (e, item) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(item.value);
      }
    },
    [onChange],
  );

  const resetItem = useCallback(() => {
    const defaultValue = props.default || props.items[0]?.value;
    onChange(defaultValue);
    toast(variables.getMessage('toasts.reset'));
  }, [onChange, props.default, props.items]);

  const id = 'dropdown' + props.name;
  const label = props.label || '';
  const selectedItem = props.items.find((item) => item?.value === value);

  return (
    <div
      className={`dropdown ${id} ${props.disabled ? 'disabled' : ''} ${opensUp ? 'up' : ''}`}
      ref={containerRef}
    >
      {label && (
        <div className="dropdown-header">
          <span className="dropdown-label">{label}</span>
          <button
            type="button"
            className="dropdown-reset"
            onClick={resetItem}
            disabled={props.disabled}
          >
            <MdRefresh />
            {variables.getMessage('modals.main.settings.buttons.reset')}
          </button>
        </div>
      )}
      <div
        className="dropdown-control"
        onClick={() => {
          if (props.disabled) return;
          if (isOpen) setIsOpen(false);
          else openMenu();
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-activedescendant={
          isOpen && focusedIndex >= 0 ? `${menuId}-${focusedIndex}` : undefined
        }
        aria-disabled={props.disabled || undefined}
        aria-label={label || props.name}
        aria-labelledby={!label && rowLabel ? rowLabel : undefined}
        tabIndex={props.disabled ? -1 : 0}
      >
        <span className="dropdown-value">{selectedItem?.text || value}</span>
        <MdExpandMore className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
      </div>
      {isOpen && (
        <div id={menuId} className="dropdown-menu" role="listbox" aria-label={label || props.name}>
          {items.map((item, index) =>
            item !== null ? (
              <div
                key={id + item.value}
                id={`${menuId}-${index}`}
                ref={(el) => (optionsRef.current[index] = el)}
                className={`dropdown-option ${value === item.value ? 'selected' : ''} ${index === focusedIndex ? 'focused' : ''}`}
                onClick={() => onChange(item.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, item)}
                role="option"
                aria-selected={value === item.value}
                tabIndex={-1}
              >
                <span className="dropdown-option-text">{item.text}</span>
                {value === item.value && <MdCheck className="dropdown-option-check" />}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export { Dropdown as default, Dropdown };
