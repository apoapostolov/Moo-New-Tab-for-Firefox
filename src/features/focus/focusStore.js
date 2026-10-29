import EventBus from 'utils/eventbus';

const KEY = 'focusSession';
export const boundedMinutes = (key, fallback) => {
  const n = Number(localStorage.getItem(key));
  return Number.isFinite(n) && n >= 1 && n <= 240 ? n : fallback;
};
export function readFocusSession() {
  try {
    const session = JSON.parse(localStorage.getItem(KEY) || 'null');
    return session &&
      ['focus', 'work', 'break', 'longBreak'].includes(session.phase) &&
      (session.phase === 'focus' || Number.isFinite(session.end))
      ? session
      : null;
  } catch {
    return null;
  }
}
export function saveFocusSession(session) {
  if (session) localStorage.setItem(KEY, JSON.stringify(session));
  else localStorage.removeItem(KEY);
  EventBus.emit('focus', session);
}
export function startFocus(now = Date.now()) {
  saveFocusSession(
    localStorage.getItem('focusMode') === 'pomodoro'
      ? { phase: 'work', end: now + boundedMinutes('pomodoroWork', 25) * 60000, completed: 0 }
      : { phase: 'focus', started: now },
  );
}
export function advanceFocus(session, now = Date.now()) {
  if (!session || session.phase === 'focus' || session.paused) return session;
  let next = session;
  // Deadlines advance from the previous boundary, so throttled/background tabs don't drift.
  for (let i = 0; next.end <= now && i < 10000; i++) {
    if (next.phase === 'work') {
      const completed = (next.completed || 0) + 1;
      const every = Math.max(1, Math.min(12, Number(localStorage.getItem('pomodoroRounds')) || 4));
      const long = completed % every === 0;
      next = {
        phase: long ? 'longBreak' : 'break',
        completed,
        end:
          next.end +
          boundedMinutes(long ? 'pomodoroLongBreak' : 'pomodoroBreak', long ? 15 : 5) * 60000,
      };
    } else {
      next = {
        phase: 'work',
        completed: next.completed || 0,
        end: next.end + boundedMinutes('pomodoroWork', 25) * 60000,
      };
    }
  }
  return next;
}
export function pauseFocus(now = Date.now()) {
  const current = advanceFocus(readFocusSession(), now);
  if (!current || current.phase === 'focus') return;
  saveFocusSession(
    current.paused
      ? { ...current, paused: false, end: now + current.remaining }
      : { ...current, paused: true, remaining: Math.max(0, current.end - now) },
  );
}
export const isFocusing = (session = advanceFocus(readFocusSession())) =>
  Boolean(session && !session.paused && ['focus', 'work'].includes(session.phase));

export function focusCounter(session, now = Date.now()) {
  const milliseconds =
    session?.phase === 'focus'
      ? now - (Number.isFinite(session.started) ? session.started : now)
      : session?.paused
        ? session.remaining
        : (session?.end ?? now) - now;
  const seconds =
    Math.max(
      0,
      session?.phase === 'focus' ? Math.floor(milliseconds / 1000) : Math.ceil(milliseconds / 1000),
    ) || 0;
  const padded = (value) => String(value).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}:${padded(minutes % 60)}:${padded(seconds % 60)}`
    : `${padded(minutes)}:${padded(seconds % 60)}`;
}
