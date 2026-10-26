import { useCallback, useEffect, useMemo, useState } from 'react';

import EventBus from 'utils/eventbus';
import { getSurface } from 'utils/widgetSurface';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { listTaskLists, listTasks, setTaskCompleted } from './services/tasks';
import { getTasksSettings, refreshMs } from './settings';
import ConnectPrompt, { describeError } from './components/ConnectPrompt';
import TaskDialog from './components/TaskDialog';

import './google.scss';

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);

  return copy;
};

/** A task is due on a day, not a moment: Google stamps midnight UTC, so both sides are pulled back
 * to local midnight or a task due today reads as yesterday west of Greenwich. */
const dayNumber = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
};

const dueLabel = (due, dateStyle = 'relative') => {
  if (!due) return '';

  const date = new Date(due);

  if (Number.isNaN(date.getTime())) return '';

  if (dateStyle === 'absolute') {
    // Day first and a lower case month, the way a date is said out loud.
    const month = date.toLocaleDateString('en-GB', { month: 'short' }).toLowerCase();

    return `${date.getDate()} ${month}`;
  }

  const days = dayNumber(due) - dayNumber(new Date());

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `in ${days} days`;

  return `${Math.abs(days)} days ago`;
};

/** Overdue, today, next seven days, later, and anything without a date. */
const dueBucket = (due) => {
  if (!due) return 'No due date';

  const date = new Date(due);
  const today = new Date();

  if (date < new Date(today.toDateString())) return 'Overdue';
  if (date <= endOfDay(today)) return 'Today';

  const week = new Date(today);
  week.setDate(week.getDate() + 7);

  if (date <= week) return 'This week';

  return 'Later';
};

const BUCKET_ORDER = ['Overdue', 'Today', 'This week', 'Later', 'No due date'];

const GoogleTasks = () => {
  const { auth, loading, error, connectAccount } = useGoogleAuth();
  const [settings, setSettings] = useState(getTasksSettings);
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState(() => getTasksSettings().listId);
  const [tasks, setTasks] = useState([]);
  const [fetchError, setFetchError] = useState('');
  // Nothing is drawn until the first answer is in: an empty card that fills in later reads
  // as broken.
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadLists = useCallback(async () => {
    try {
      const loaded = await listTaskLists();
      setLists(loaded);

      const stored = getTasksSettings().listId;
      const valid = loaded.some((list) => list.id === stored);

      if (!valid && loaded.length) {
        localStorage.setItem('googleTasksList', loaded[0].id);
        setListId(loaded[0].id);
      }

      return valid ? stored : loaded[0]?.id ?? '';
    } catch (loadError) {
      setFetchError(loadError.message);

      return '';
    }
  }, []);

  const loadTasks = useCallback(async (id) => {
    if (!id) return;

    const current = getTasksSettings();

    try {
      const loaded = await listTasks(id, { showCompleted: current.showCompleted });

      setTasks(current.hideUndated ? loaded.filter((task) => task.due) : loaded);
    } catch (loadError) {
      setFetchError(loadError.message);
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;

    setSettings(getTasksSettings());

    let timer;

    loadLists()
      .then((id) =>
        // The interval starts only once the first list has been answered, so it never races the
        // initial load for the same data.
        loadTasks(id).then(() => {
          timer = setInterval(() => loadTasks(id), refreshMs(getTasksSettings().refreshMinutes));
        }),
      )
      .finally(() => setReady(true));

    const onRefresh = (category) => {
      if (!category || category === 'google' || category === 'tasks') {
        setSettings(getTasksSettings());
        loadLists().then((id) => loadTasks(id));
      }
    };

    EventBus.on('refresh', onRefresh);

    return () => {
      clearInterval(timer);
      EventBus.off('refresh', onRefresh);
    };
  }, [auth, loadLists, loadTasks]);

  const changeList = (id) => {
    localStorage.setItem('googleTasksList', id);
    setListId(id);
    setTasks([]);
    loadTasks(id);
  };

  const toggle = async (task) => {
    const completed = task.status !== 'completed';

    // Optimistic: the checkbox has to react under the finger.
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: completed ? 'completed' : 'needsAction' } : item,
      ),
    );

    try {
      await setTaskCompleted(listId, task.id, completed);
    } catch (toggleError) {
      setFetchError(toggleError.message);
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status: task.status } : item)),
      );
    }
  };

  const onSaved = useCallback((saved) => {
    setTasks((current) => {
      const exists = current.some((task) => task.id === saved.id);

      return exists
        ? current.map((task) => (task.id === saved.id ? saved : task))
        : [saved, ...current];
    });
  }, []);

  const onDeleted = useCallback((id) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  const ordered = useMemo(() => {
    // A ticked task stays in the list, struck through, until Google is asked again: making it
    // vanish under the finger reads as a delete.
    const kept = tasks.filter((task) => (settings.hideUndated ? Boolean(task.due) : true));

    const sorted = [...kept];

    if (settings.sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (settings.sort === 'due') {
      sorted.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;

        return new Date(a.due) - new Date(b.due);
      });
    } else if (settings.sort === 'added') {
      sorted.reverse();
    }

    return sorted.slice(0, settings.maxItems);
  }, [tasks, settings]);

  const groups = useMemo(() => {
    if (!settings.groupByDue) return null;

    const buckets = new Map();

    ordered.forEach((task) => {
      const key = dueBucket(task.due);
      buckets.set(key, [...(buckets.get(key) ?? []), task]);
    });

    return BUCKET_ORDER.filter((key) => buckets.has(key)).map((key) => [key, buckets.get(key)]);
  }, [ordered, settings.groupByDue]);

  if (loading) return null;

  if (!auth) {
    return <ConnectPrompt label="Tasks" onConnect={connectAccount} error={error} />;
  }

  if (!ready) return null;

  const row = (task) => (
    <li
      key={task.id}
      className={`gwTaskRow${task.status === 'completed' ? ' done' : ''}`}
    >
      {/* The slot is one line of the title's own text, so the box sits on the
          middle of the first line instead of on a guessed pixel offset. */}
      <span className="gwCheckSlot">
        <input
          type="checkbox"
          className="gwCheck"
          checked={task.status === 'completed'}
          onChange={() => toggle(task)}
          aria-label={`Complete ${task.title}`}
        />
      </span>
      <button type="button" className="gwItem bare" onClick={() => setEditing(task)}>
        <span className="gwItemTop">
          <span className="gwItemTitle">{task.title}</span>
          {task.due && (
                      <span className="gwItemMeta">{dueLabel(task.due, settings.dateStyle)}</span>
                    )}
        </span>
        {settings.showNotes && task.notes && <span className="gwItemSub">{task.notes}</span>}
      </button>
    </li>
  );

  return (
    <div className={`googleWidget ${getSurface('tasks')}`}>
      <header className="gwHead">
        <span className="gwLabel">
          {lists.length > 1 ? (
            <select
              className="gwSelect"
              value={listId}
              onChange={(changeEvent) => changeList(changeEvent.target.value)}
              aria-label="Task list"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          ) : (
            lists[0]?.title || 'Tasks'
          )}
        </span>
        <button
          type="button"
          className="gwIconButton"
          onClick={() => setEditing({})}
          aria-label="New task"
          title="New task"
        >
          +
        </button>
      </header>

      {fetchError && <p className="gwError">{describeError(fetchError)}</p>}

      {!fetchError && !ordered.length && <p className="gwEmpty">Nothing left to do.</p>}

      {groups
        ? groups.map(([bucket, bucketTasks]) => (
            <div className="gwDay" key={bucket}>
              <span className="gwDayLabel">{bucket}</span>
              <ul className="gwList">{bucketTasks.map(row)}</ul>
            </div>
          ))
        : <ul className="gwList">{ordered.map(row)}</ul>}

      {editing && (
        <TaskDialog
          task={editing.id ? editing : null}
          listId={listId}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
};

export default GoogleTasks;
