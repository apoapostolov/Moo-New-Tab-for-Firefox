import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo, useRef, useEffect, useCallback } from 'react';

import './Textarea.scss';

const Textarea = memo(
  ({ value, onChange, placeholder, minRows = 1, maxRows, className, style, readOnly }) => {
    useTranslationVersion();
    const textareaRef = useRef(null);

    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Height must be reset to auto first, or scrollHeight never shrinks.
      textarea.style.height = 'auto';

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight) || 24;
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;

      const minHeight = minRows * lineHeight + paddingTop + paddingBottom;
      const maxHeight = maxRows ? maxRows * lineHeight + paddingTop + paddingBottom : Infinity;

      // Content height clamped between min and max.
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [minRows, maxRows]);

    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Measure on mount and on window resize.
    useEffect(() => {
      adjustHeight();
      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, [adjustHeight]);

    return (
      <textarea
        ref={textareaRef}
        className={`textarea-autosize${className ? ` ${className}` : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder || 'Notes'}
        style={style}
        readOnly={readOnly}
        rows={minRows}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea as default, Textarea };
