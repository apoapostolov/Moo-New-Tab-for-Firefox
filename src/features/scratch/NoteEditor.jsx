import { useLayoutEffect, useRef } from 'react';
import { uiText } from 'lib/translations';
import useScrollThumb from 'utils/useScrollThumb';

export default function NoteEditor({
  text,
  readOnly,
  onChange,
  onBlur,
  angle = 0,
  label,
  maxLength,
}) {
  const input = useRef(null);
  useScrollThumb(input, true, false, angle);
  useLayoutEffect(() => {
    const element = input.current;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [text]);
  return (
    <textarea
      ref={input}
      className="scratchNoteInput"
      readOnly={readOnly}
      value={text}
      aria-label={label}
      maxLength={maxLength}
      placeholder={uiText('write_here_markdown_supported_e2bd9d')}
      autoFocus
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
