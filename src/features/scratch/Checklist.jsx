import { useLayoutEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MdAdd,
  MdClose,
  MdOutlineDragIndicator,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
} from 'react-icons/md';
import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { formatPercentage } from 'utils/formatNumber';
import { ChecklistMarkdown, checklistLabel } from './Markdown';
import {
  branchEnd,
  checklistProgress,
  compactChecklistItems,
  indentChecklistItem,
  MAX_CHECKLIST_ITEMS,
  moveChecklistItem,
  newChecklistItem,
  removeChecklistItem,
  setChecklistCompleted,
  validChecklist,
} from './checklistStore';
import 'features/google/google.scss';
import './checklist.scss';

const INDENT = 18;
const listScroll = {
  canScroll: (element) => element.classList.contains('scratchChecklistItems'),
  layoutShiftCompensation: false,
};

export function ChecklistProgress({ items }) {
  const { language } = useTranslationVersion();
  const { done, total, fraction } = checklistProgress(items);
  const label = uiText('checklist_progress', { done, total });
  return (
    <footer className="scratchChecklistProgress" title={label}>
      <progress value={done} max={total || 1} aria-label={label} />
      <span>{formatPercentage(fraction, language)}</span>
    </footer>
  );
}

function ChecklistRow({
  item,
  number,
  editable,
  readOnly,
  initialFocus,
  selected,
  inputRef,
  onFocus,
  onText,
  onKeyDown,
  onToggle,
  onRemove,
  onEdit,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: readOnly });
  const name = checklistLabel(item.text) || uiText('checklist_entry', { number });
  return (
    <li
      ref={setNodeRef}
      data-entry-id={item.id}
      data-depth={item.depth}
      className={`scratchChecklistRow${item.completed ? ' completed' : ''}${isDragging ? ' moving' : ''}${selected ? ' selected' : ''}`}
      style={{
        '--entry-indent': `${item.depth * INDENT}px`,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        className="scratchChecklistGrip"
        type="button"
        aria-label={uiText('drag_named', { name })}
        {...attributes}
        {...listeners}
        aria-roledescription={uiText('checklist_reorder')}
        disabled={readOnly}
      >
        <MdOutlineDragIndicator />
      </button>
      <input
        className="scratchChecklistCheck"
        type="checkbox"
        checked={item.completed}
        disabled={readOnly}
        aria-label={uiText('checklist_complete', { name })}
        onChange={(event) => onToggle(event.target.checked)}
      />
      {editable ? (
        <input
          ref={inputRef}
          className="scratchChecklistEntry"
          value={item.text}
          maxLength={2000}
          aria-label={uiText('checklist_entry', { number })}
          autoFocus={initialFocus}
          autoComplete="off"
          onFocus={onFocus}
          onChange={(event) => onText(event.target.value)}
          onKeyDown={onKeyDown}
        />
      ) : (
        <button className="scratchChecklistText" type="button" onClick={onEdit} disabled={readOnly}>
          <ChecklistMarkdown text={item.text} />
        </button>
      )}
      {editable && (
        <button
          className="scratchChecklistRemove"
          type="button"
          aria-label={uiText('remove_named', { name })}
          onClick={onRemove}
        >
          <MdClose />
        </button>
      )}
    </li>
  );
}

export function ChecklistEntries({
  items,
  onChange,
  editable = false,
  readOnly = false,
  initialItemId,
  onEdit,
  onDragStateChange,
}) {
  useTranslationVersion();
  const [selected, setSelected] = useState(initialItemId || null);
  const [dragging, setDragging] = useState(false);
  const inputs = useRef(new Map());
  const focusRequest = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useLayoutEffect(() => {
    if (!focusRequest.current) return;
    inputs.current.get(focusRequest.current)?.focus();
    focusRequest.current = null;
  }, [items]);
  const add = (afterId) => {
    if (items.length >= MAX_CHECKLIST_ITEMS) return;
    const index = items.findIndex((item) => item.id === afterId);
    const item = newChecklistItem('', index >= 0 ? items[index].depth : 0);
    const next = [...items];
    next.splice(index >= 0 ? branchEnd(items, index) : items.length, 0, item);
    focusRequest.current = item.id;
    onChange(next);
  };
  const remove = (item, index) => {
    if (items.length === 1) {
      const blank = newChecklistItem();
      focusRequest.current = blank.id;
      onChange([blank]);
      return;
    }
    focusRequest.current = items[index - 1]?.id || items[index + 1]?.id;
    onChange(removeChecklistItem(items, item.id));
  };
  const indent = (id, direction) => {
    const next = indentChecklistItem(items, id, direction);
    if (next === items) return false;
    focusRequest.current = id;
    onChange(next);
    return true;
  };
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        autoScroll={listScroll}
        accessibility={{
          restoreFocus: true,
          screenReaderInstructions: { draggable: uiText('checklist_drag_help') },
          announcements: {
            onDragStart: ({ active }) =>
              uiText('checklist_picked_up', {
                name:
                  checklistLabel(items.find((item) => item.id === active.id)?.text) ||
                  uiText('checklist_entries'),
              }),
            onDragOver: ({ over }) =>
              over
                ? uiText('checklist_drop_over', {
                    name:
                      checklistLabel(items.find((item) => item.id === over.id)?.text) ||
                      uiText('checklist_entries'),
                  })
                : undefined,
            onDragEnd: () => uiText('checklist_move_finished'),
            onDragCancel: () => uiText('checklist_move_cancelled'),
          },
        }}
        onDragStart={() => {
          setDragging(true);
          onDragStateChange?.(true);
        }}
        onDragCancel={() => {
          setDragging(false);
          onDragStateChange?.(false);
        }}
        onDragEnd={({ active, over, delta }) => {
          setDragging(false);
          onDragStateChange?.(false);
          if (over)
            onChange(moveChecklistItem(items, active.id, over.id, Math.round(delta.x / INDENT)));
        }}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul
            className={`scratchChecklistItems${dragging ? ' reordering' : ''}`}
            aria-label={uiText('checklist_entries')}
          >
            {items.map((item, index) => (
              <ChecklistRow
                key={item.id}
                item={item}
                number={index + 1}
                editable={editable}
                readOnly={readOnly}
                initialFocus={initialItemId === item.id}
                selected={selected === item.id}
                inputRef={(element) => {
                  if (element) inputs.current.set(item.id, element);
                  else inputs.current.delete(item.id);
                }}
                onFocus={() => setSelected(item.id)}
                onEdit={() => onEdit?.(item.id)}
                onText={(text) =>
                  onChange(
                    items.map((entry) => (entry.id === item.id ? { ...entry, text } : entry)),
                  )
                }
                onToggle={(completed) => onChange(setChecklistCompleted(items, item.id, completed))}
                onRemove={() => remove(item, index)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    add(item.id);
                  } else if (
                    event.key === 'Tab' &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey
                  ) {
                    if (indent(item.id, event.shiftKey ? -1 : 1)) event.preventDefault();
                  } else if (event.key === 'Backspace' && !item.text) {
                    event.preventDefault();
                    remove(item, index);
                  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    const next = items[index + (event.key === 'ArrowUp' ? -1 : 1)];
                    if (next) {
                      event.preventDefault();
                      inputs.current.get(next.id)?.focus();
                    }
                  }
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {editable && (
        <>
          <div className="scratchChecklistTools">
            <button
              className="gwButton scratchChecklistAdd"
              type="button"
              onClick={() => add()}
              disabled={items.length >= MAX_CHECKLIST_ITEMS}
            >
              <MdAdd />
              {uiText('checklist_add_entry')}
            </button>
            <span />
            <button
              className="scratchChecklistTool"
              type="button"
              aria-label={uiText('checklist_outdent')}
              title={uiText('checklist_outdent')}
              disabled={!selected || indentChecklistItem(items, selected, -1) === items}
              onClick={() => indent(selected, -1)}
            >
              <MdFormatIndentDecrease />
            </button>
            <button
              className="scratchChecklistTool"
              type="button"
              aria-label={uiText('checklist_indent')}
              title={uiText('checklist_indent')}
              disabled={!selected || indentChecklistItem(items, selected, 1) === items}
              onClick={() => indent(selected, 1)}
            >
              <MdFormatIndentIncrease />
            </button>
          </div>
          <p className="scratchChecklistHint">{uiText('checklist_keyboard_hint')}</p>
        </>
      )}
    </>
  );
}

export default function ChecklistEditor({
  initial,
  initialItemId,
  onSave,
  onCancel,
  existing = false,
}) {
  useTranslationVersion();
  const [title, setTitle] = useState(initial.title || '');
  const [items, setItems] = useState(() =>
    initial.items.length ? initial.items : [newChecklistItem()],
  );
  const [error, setError] = useState(null);
  const dragging = useRef(false);
  return (
    <form
      className="gwForm scratchChecklistForm scratchCountdownForm"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !dragging.current) {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const value = { title: title.trim(), items: compactChecklistItems(items) };
        if (!validChecklist(value)) {
          setError({ key: 'checklist_invalid' });
          return;
        }
        try {
          onSave(value);
        } catch (error) {
          setError({ key: 'checklist_save_error', values: { error: error.message } });
        }
      }}
    >
      <div className="scratchCountdownHeading">
        {uiText(existing ? 'checklist_edit' : 'checklist_new')}
      </div>
      <label>
        <span>
          {uiText('field_title')} ({uiText('portfolio_optional')})
        </span>
        <input
          value={title}
          maxLength={200}
          autoFocus={!initialItemId}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form.querySelector('.scratchChecklistEntry')?.focus();
            }
          }}
        />
      </label>
      <ChecklistEntries
        items={items}
        onChange={setItems}
        editable
        initialItemId={initialItemId}
        onDragStateChange={(active) => {
          dragging.current = active;
        }}
      />
      {error && (
        <p role="alert" className="gwError">
          {uiText(error.key, error.values)}
        </p>
      )}
      <div className="scratchCountdownActions">
        <button className="gwButton" type="button" onClick={onCancel}>
          {uiText('portfolio_cancel')}
        </button>
        <button className="gwButton primary" type="submit">
          {uiText('checklist_save')}
        </button>
      </div>
      <ChecklistProgress items={items} />
    </form>
  );
}
