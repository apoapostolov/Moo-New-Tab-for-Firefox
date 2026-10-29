import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { memo, useState, useEffect, useRef } from 'react';
import { useT } from 'contexts';

import {
  MdChecklist,
  MdPushPin,
  MdDelete,
  MdPlaylistAdd,
  MdOutlineDragIndicator,
  MdPlaylistRemove,
  MdCheck,
} from 'react-icons/md';
import { Tooltip } from 'components/Elements';
import { Textarea } from 'components/Form/Settings';
import { shift, useFloating } from '@floating-ui/react-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EventBus from 'utils/eventbus';

const verticalDrag = ({ transform }) => ({ ...transform, x: 0 });
const dragModifiers = [verticalDrag];
const todoAutoScroll = {
  canScroll: (element) => element.classList.contains('todoRows'),
  layoutShiftCompensation: false,
};

const DragHandle = (props) => (
  <button
    type="button"
    aria-label={uiText('move_task_3481b3')}
    className="todo-drag-handle"
    {...props}
  >
    <MdOutlineDragIndicator />
  </button>
);

const SortableItem = ({ id, children }) => {
  useTranslationVersion();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      {typeof children === 'function' ? children({ attributes, listeners }) : children}
    </div>
  );
};

const SortableList = ({ items, onDragStart, onDragEnd, onDragCancel, children }) => {
  useTranslationVersion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={dragModifiers}
      autoScroll={todoAutoScroll}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div>{children}</div>
      </SortableContext>
    </DndContext>
  );
};

function Todo({ todoRef, floatRef, position, xPosition, yPosition }) {
  useTranslationVersion();
  const t = useT();
  const [todo, setTodo] = useState(JSON.parse(localStorage.getItem('todo')) || []);
  const [showTodo, setShowTodo] = useState(localStorage.getItem('todoPinned') === 'true');
  const listRef = useRef(null);
  const shellRef = useRef(null);
  const dragging = useRef(false);
  const focusNewTask = useRef(false);
  const [zoomFontSize, setZoomFontSize] = useState(
    () => `${(1.2 * Number(localStorage.getItem('zoomNavbar') || 100)) / 100}rem`,
  );

  useEffect(() => {
    if (!focusNewTask.current) return;
    focusNewTask.current = false;
    listRef.current?.querySelector(`[data-todo-index="${todo.length - 1}"] textarea`)?.focus();
  }, [todo.length]);

  useEffect(() => {
    const handleRefresh = (data) => {
      if (data === 'navbar') {
        setZoomFontSize(Number(((localStorage.getItem('zoomNavbar') || 100) / 100) * 1.2) + 'rem');
      }
    };

    EventBus.on('refresh', handleRefresh);
    return () => {
      EventBus.off('refresh', handleRefresh);
    };
  }, []);

  const handleShowTodo = () => {
    setShowTodo(true);
  };

  const handleHideTodo = () => {
    const shell = shellRef.current;
    if (dragging.current || shell?.matches(':hover') || shell?.contains(document.activeElement))
      return;
    setShowTodo(localStorage.getItem('todoPinned') === 'true');
  };

  const handleDragStart = () => {
    dragging.current = true;
    setShowTodo(true);
  };

  const finishDrag = () => {
    dragging.current = false;
    handleHideTodo();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);

      setTodo((currentTodo) => {
        const newTodo = arrayMove(currentTodo, oldIndex, newIndex);
        localStorage.setItem('todo', JSON.stringify(newTodo));
        return newTodo;
      });
    }
    finishDrag();
  };

  /** `action` is 'add', 'remove', 'set' or 'done'; `index` is where it applies. */
  const updateTodo = (action, index, data) => {
    if (action === 'add') focusNewTask.current = true;
    setTodo((currentTodo) => {
      const newTodo = [...currentTodo];

      switch (action) {
        case 'add':
          newTodo.push({ value: '', done: false });
          break;
        case 'remove':
          newTodo.splice(index, 1);
          break;
        case 'set':
          newTodo[index] = { value: data.target.value, done: newTodo[index].done };
          break;
        case 'done':
          newTodo[index].done = !newTodo[index].done;
          break;
        default:
          break;
      }

      localStorage.setItem('todo', JSON.stringify(newTodo));
      return newTodo;
    });
  };

  const handlePin = () => {
    variables.stats.postEvent('feature', 'Todo pin');
    const todoPinned = localStorage.getItem('todoPinned') === 'true';
    localStorage.setItem('todoPinned', !todoPinned);
    setShowTodo(!todoPinned);
  };

  return (
    <div
      className="notes"
      ref={shellRef}
      onMouseLeave={handleHideTodo}
      onFocus={handleShowTodo}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) handleHideTodo();
      }}
    >
      <button
        className="navbarButton"
        onMouseEnter={handleShowTodo}
        onFocus={handleShowTodo}
        aria-label={t('widgets.navbar.todo.title')}
        ref={todoRef}
        style={{ fontSize: zoomFontSize }}
      >
        <MdChecklist className="topicons" />
      </button>
      {showTodo && (
        <span
          className="notesContainer todoPopover"
          ref={floatRef}
          style={{
            position: position,
            top: yPosition ?? '44px',
            left: xPosition ?? '',
          }}
        >
          <div className="flexTodo">
            <div className="topBarNotes" style={{ display: 'flex' }}>
              <MdChecklist />
              <span>{t('widgets.navbar.todo.title')}</span>
            </div>
            <div className="notes-buttons">
              <Tooltip title={t('widgets.navbar.todo.pin')}>
                <button type="button" aria-label={t('widgets.navbar.todo.pin')} onClick={handlePin}>
                  <MdPushPin />
                </button>
              </Tooltip>
              <Tooltip title={t('widgets.navbar.todo.add')}>
                <button
                  type="button"
                  aria-label={t('widgets.navbar.todo.add')}
                  onClick={() => updateTodo('add')}
                >
                  <MdPlaylistAdd />
                </button>
              </Tooltip>
            </div>
            <div className="todoRows" ref={listRef}>
              {todo.length === 0 ? (
                <div className="todosEmpty">
                  <div className="emptyNewMessage">
                    <MdPlaylistRemove />
                    <span className="title">{t('widgets.navbar.todo.no_todos')}</span>
                    <span className="subtitle">
                      {t('modals.main.settings.sections.message.add_some')}
                    </span>
                  </div>
                </div>
              ) : (
                <SortableList
                  items={todo.map((_, index) => index)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={finishDrag}
                >
                  {todo.map((todoItem, index) => (
                    <SortableItem key={index} id={index}>
                      {({ attributes, listeners }) => (
                        <div
                          className={'todoRow' + (todoItem.done ? ' done' : '')}
                          data-todo-index={index}
                        >
                          <button
                            type="button"
                            aria-label={uiText('complete_task_af20ec')}
                            aria-pressed={todoItem.done}
                            className={'todo-checkbox' + (todoItem.done ? ' checked' : '')}
                            onClick={() => updateTodo('done', index)}
                          >
                            {todoItem.done && <MdCheck />}
                          </button>
                          <Textarea
                            placeholder={uiText('task_7bb0dd')}
                            value={todoItem.value}
                            onChange={(data) => updateTodo('set', index, data)}
                            readOnly={todoItem.done}
                            minRows={2}
                            maxRows={8}
                          />
                          <div className="todoActions">
                            <Tooltip title={t('modals.main.marketplace.product.buttons.remove')}>
                              <button
                                type="button"
                                className="todo-delete"
                                aria-label={uiText('remove_task_5be1bc')}
                                onClick={() => updateTodo('remove', index)}
                              >
                                <MdDelete />
                              </button>
                            </Tooltip>
                            <DragHandle {...attributes} {...listeners} />
                          </div>
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </SortableList>
              )}
            </div>
          </div>
        </span>
      )}
    </div>
  );
}

function TodoWrapper() {
  useTranslationVersion();
  const [reference, setReference] = useState(null);

  const { x, y, refs, strategy } = useFloating({
    placement: 'bottom',
    middleware: [shift({ padding: 12 })],
    elements: { reference },
  });

  return (
    <Todo
      todoRef={setReference}
      floatRef={refs.setFloating}
      position={strategy}
      xPosition={x}
      yPosition={y}
    />
  );
}

const MemoizedTodoWrapper = memo(TodoWrapper);
export { MemoizedTodoWrapper as default, MemoizedTodoWrapper as Todo };
