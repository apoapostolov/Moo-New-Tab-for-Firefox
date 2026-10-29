import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useRef, useState } from 'react';

import Dialog from './Dialog';
import { useNaturalTitle } from '../useNaturalTitle';
import { describe } from '../natural';
import { taskFormFromNatural } from '../naturalForms';
import NaturalHelp from './NaturalHelp';
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
    status: task?.status || 'needsAction',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const manualFields = useRef(new Set());

  /** The title box takes the day as well: "pay rent in 9 days" sets the due date. */
  const applyParsed = (parsed) => {
    setForm((current) => taskFormFromNatural(current, parsed, manualFields.current));
  };

  const { parsed, read } = useNaturalTitle(form.title, 'task', applyParsed, {
    enabled: !isEditing || titleEdited,
  });

  const update = (key) => (changeEvent) => {
    if (key === 'title') setTitleEdited(true);
    else manualFields.current.add(key);
    setForm((current) => ({ ...current, [key]: changeEvent.target.value }));
  };

  const save = async (submitEvent) => {
    submitEvent.preventDefault();

    const finalParsed = read();
    const finalForm = taskFormFromNatural(form, finalParsed, manualFields.current);
    const title = (finalParsed ? finalParsed.title : form.title).trim();
    if (!title) {
      setError('A title is needed.');

      return;
    }

    if (title.length > 1024 || finalForm.notes.length > 8192) {
      setError('Keep the task title within 1,024 characters and notes within 8,192 characters.');
      return;
    }
    setBusy(true);
    setError('');

    try {
      const payload = {
        title,
        notes: finalForm.notes,
        status: finalForm.status,
        // Google Tasks wants a date at midnight UTC.
        due: finalForm.due ? `${finalForm.due}T00:00:00.000Z` : '',
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
      actions={<NaturalHelp kind="task" editing={isEditing} />}
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
