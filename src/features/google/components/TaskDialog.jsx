import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState } from 'react';

import Dialog from './Dialog';
import { useNaturalTitle } from '../useNaturalTitle';
import { describe } from '../natural';
import {
  createTask,
  deleteTask,
  setTaskCompleted,
  toDueInput,
  updateTask,
} from '../services/tasks';
import { examplePlaceholder } from '../examples';

/**
 * Create, rename, re-date, complete and delete a task. Completing is a status change, so one
 * dialog handles both directions.
 */
const TaskDialog = ({ task, listId, onClose, onSaved, onDeleted }) => {
  useTranslationVersion();
  const isEditing = Boolean(task?.id);

  // One example per opening, so the title box keeps the same sentence while it is being read.
  const [titlePlaceholder] = useState(() => examplePlaceholder('task'));
  const [form, setForm] = useState(() => ({
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    due: toDueInput(task?.due),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** The title box takes the day as well: "pay rent in 9 days" sets the due date. */
  const applyParsed = (parsed) => {
    if (!parsed.date) return;

    const day = new Date(parsed.date);
    const stamp = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate(),
    ).padStart(2, '0')}`;

    setForm((current) => ({ ...current, due: stamp }));
  };

  const parsed = useNaturalTitle(form.title, 'task', applyParsed);

  const update = (key) => (changeEvent) =>
    setForm((current) => ({ ...current, [key]: changeEvent.target.value }));

  const save = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!form.title.trim()) {
      setError('A title is needed.');

      return;
    }

    setBusy(true);
    setError('');

    try {
      const payload = {
        title: (parsed?.title || form.title).trim(),
        notes: form.notes,
        // Google Tasks wants a date at midnight UTC.
        due: form.due ? `${form.due}T00:00:00.000Z` : '',
      };

      const saved = isEditing
        ? await updateTask(listId, task.id, payload)
        : await createTask(listId, payload);

      onSaved(saved, listId);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleCompleted = async () => {
    setBusy(true);
    setError('');

    try {
      const saved = await setTaskCompleted(listId, task.id, !(task.status === 'completed'));
      onSaved(saved, listId);
      onClose();
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');

    try {
      await deleteTask(listId, task.id);
      onDeleted(task.id, listId);
      onClose();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={isEditing ? 'Edit task' : 'New task'}
      onClose={onClose}
      footer={
        <>
          {isEditing && (
            <>
              <button type="button" className="gwButton danger" onClick={remove} disabled={busy}>
                {uiText('delete_f6fdbe')}
              </button>
              <button type="button" className="gwButton" onClick={toggleCompleted} disabled={busy}>
                {task.status === 'completed' ? 'Reopen' : 'Complete'}
              </button>
            </>
          )}
          <span className="gwSpacer" />
          <button type="button" className="gwButton" onClick={onClose} disabled={busy}>
            {uiText('cancel_77dfd2')}
          </button>
          <button type="submit" form="taskForm" className="gwButton primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="taskForm" className="gwForm" onSubmit={save}>
        <label>
          {uiText('task_7bb0dd')}
          <input
            value={form.title}
            onChange={update('title')}
            placeholder={titlePlaceholder}
            autoFocus
          />
        </label>

        {parsed && (
          <p className="gwParsedHint">
            {parsed.title && parsed.title !== form.title.trim() && (
              <>
                <span className="gwParsedTitle">“{parsed.title}”</span>
                {' · '}
              </>
            )}
            {describe(parsed, 'task')}
          </p>
        )}

        <label>
          {uiText('due_145caf')}
          <input type="date" value={form.due} onChange={update('due')} />
        </label>

        <label>
          {uiText('notes_704400')}
          <textarea value={form.notes} onChange={update('notes')} rows={3} />
        </label>

        {error && <p className="gwError">{error}</p>}
      </form>
    </Dialog>
  );
};

export default TaskDialog;
