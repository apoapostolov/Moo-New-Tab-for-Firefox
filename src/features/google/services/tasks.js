import { googleFetch, googlePages } from '../api';

const LISTS = '/tasks/v1/users/@me/lists';

const toTask = (task) => ({
  id: task.id,
  title: task.title || '(no title)',
  notes: task.notes ?? '',
  due: task.due ?? '',
  status: task.status ?? 'needsAction',
  completed: task.completed ?? '',
  position: task.position ?? '',
});

export const listTaskLists = async (signal) => {
  const items = await googlePages(`${LISTS}?maxResults=100`, { signal });

  return items.map((list) => ({ id: list.id, title: list.title || 'Tasks' }));
};

export const listTasks = async (listId, { showCompleted = false, signal } = {}) => {
  const params = new URLSearchParams({
    showCompleted: String(showCompleted),
    maxResults: '100',
  });

  const items = await googlePages(`/tasks/v1/lists/${encodeURIComponent(listId)}/tasks?${params}`, {
    signal,
  });

  return items.filter((task) => !task.deleted).map(toTask);
};

export const createTask = async (listId, { title, notes = '', due = '' }) => {
  const task = await googleFetch(`/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ title, notes, ...(due ? { due } : {}) }),
  });

  return toTask(task);
};

export const updateTask = async (listId, taskId, { title, notes, due, status }) => {
  const body = {};

  if (title !== undefined) body.title = title;
  if (notes !== undefined) body.notes = notes;
  if (due !== undefined) body.due = due;
  if (status !== undefined) body.status = status;

  const task = await googleFetch(
    `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );

  return toTask(task);
};

/**
 * Completing is a status change, not a separate endpoint: the task stays in the list with
 * `status: completed` and a `completed` stamp.
 */
export const setTaskCompleted = async (listId, taskId, completed) =>
  updateTask(listId, taskId, { status: completed ? 'completed' : 'needsAction' });

export const deleteTask = async (listId, taskId) => {
  await googleFetch(
    `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'DELETE' },
  );
};

export const toDueInput = (due) => (due ? due.slice(0, 10) : '');
