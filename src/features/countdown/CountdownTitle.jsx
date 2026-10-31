import { useState } from 'react';
import { uiText } from 'lib/translations';
import Markdown, { checklistLabel } from 'features/scratch/Markdown';
import NoteEditor from 'features/scratch/NoteEditor';

export default function CountdownTitle({ title, onChange, onFocus, angle }) {
  const [editing, setEditing] = useState(false);
  if (!title.trim() && !editing) return null;
  const label = uiText('edit_named', { name: checklistLabel(title) || uiText('countdown_label') });
  const start = () => {
    onFocus?.();
    setEditing(true);
  };
  return (
    <div
      className="countdownTitle scratchNoteBody"
      data-countdown-title="true"
      onPointerDown={(event) => event.stopPropagation()}
      role={onChange && !editing ? 'button' : undefined}
      tabIndex={onChange && !editing ? 0 : undefined}
      aria-label={onChange && !editing ? label : undefined}
      onClick={
        onChange && !editing
          ? (event) => {
              if (!event.target.closest('a')) start();
            }
          : undefined
      }
      onKeyDown={
        onChange && !editing
          ? (event) => {
              if (event.target.closest('a')) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                start();
              }
            }
          : undefined
      }
    >
      {editing ? (
        <NoteEditor
          text={title}
          label={label}
          maxLength={200}
          angle={angle}
          onChange={onChange}
          onBlur={() => setEditing(false)}
        />
      ) : (
        <Markdown text={title} />
      )}
    </div>
  );
}
