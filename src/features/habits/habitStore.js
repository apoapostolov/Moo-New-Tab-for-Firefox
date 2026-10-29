import EventBus from 'utils/eventbus';

const DAY = 86400000;
export const MAX_HABITS = 200;
export const HABIT_MILESTONES = [2, 5, 10, 20, 30, 60, 90, 180, 270, 365];
export const validDay = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export const shiftDay = (value, amount) =>
  new Date(Date.parse(`${value}T00:00:00Z`) + amount * DAY).toISOString().slice(0, 10);
export const weekday = (value) => new Date(`${value}T00:00:00Z`).getUTCDay();
export const validZone = (value) => {
  if (value === 'local') return true;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return Boolean(value);
  } catch {
    return false;
  }
};
export function habitSettings() {
  const zone = localStorage.getItem('habitsTimeZone') || 'local';
  const start = localStorage.getItem('habitsDayStart') || '00:00';
  return {
    zone: validZone(zone) ? zone : 'local',
    start: /^([01]\d|2[0-3]):[0-5]\d$/.test(start) ? start : '00:00',
    weekStart: localStorage.getItem('habitsWeekStart') === '0' ? 0 : 1,
  };
}
export function habitDay(now = new Date(), settings = habitSettings()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      ...(settings.zone !== 'local' ? { timeZone: settings.zone } : {}),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return `${parts.hour}:${parts.minute}` < settings.start ? shiftDay(date, -1) : date;
}
export function validHabit(habit) {
  return Boolean(
    habit &&
    typeof habit.id === 'string' &&
    habit.id.length <= 100 &&
    habit.id &&
    typeof habit.title === 'string' &&
    habit.title.trim() &&
    habit.title.length <= 200 &&
    typeof habit.description === 'string' &&
    habit.description.length <= 2000 &&
    ['daily', 'weekdays', 'weekly'].includes(habit.frequency) &&
    Array.isArray(habit.days) &&
    habit.days.length <= 7 &&
    habit.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    new Set(habit.days).size === habit.days.length &&
    (habit.frequency !== 'weekdays' || habit.days.length > 0) &&
    Number.isInteger(habit.target) &&
    habit.target > 0 &&
    habit.target <= 100000 &&
    Number.isInteger(habit.step) &&
    habit.step > 0 &&
    habit.step <= habit.target &&
    typeof habit.unit === 'string' &&
    habit.unit.length <= 32 &&
    validDay(habit.startDate) &&
    typeof habit.archived === 'boolean' &&
    habit.logs &&
    typeof habit.logs === 'object' &&
    !Array.isArray(habit.logs) &&
    Object.keys(habit.logs).length <= 3660 &&
    Object.entries(habit.logs).every(
      ([date, count]) => validDay(date) && Number.isInteger(count) && count >= 0 && count <= 100000,
    ),
  );
}
export const validHabits = (value) =>
  Array.isArray(value) &&
  value.length <= MAX_HABITS &&
  value.every(validHabit) &&
  new Set(value.map((item) => item.id)).size === value.length;
export function readHabits() {
  try {
    const habits = JSON.parse(localStorage.getItem('habitsData') || '[]');
    return { habits: validHabits(habits) ? habits : [], damaged: !validHabits(habits) };
  } catch {
    return { habits: [], damaged: true };
  }
}
export async function updateHabits(change) {
  const revision = localStorage.getItem('profileRevision');
  const { withProfileLock } = await import('utils/settings/profile');
  return withProfileLock(() => {
    if (revision !== localStorage.getItem('profileRevision')) throw new Error('profile-changed');
    const state = readHabits();
    if (state.damaged) throw new Error('damaged');
    const next = change(state.habits);
    if (!validHabits(next)) throw new Error('invalid');
    localStorage.setItem('habitsData', JSON.stringify(next));
    EventBus.emit('habits');
    return next;
  });
}
export const scheduled = (habit, date) =>
  date >= habit.startDate &&
  !habit.archived &&
  (habit.frequency !== 'weekdays' || habit.days.includes(weekday(date)));
export const weekOf = (date, weekStart = 1) =>
  shiftDay(date, -((weekday(date) - weekStart + 7) % 7));
export const habitWeek = (date, weekStart = 1) =>
  Array.from({ length: 7 }, (_, i) => shiftDay(weekOf(date, weekStart), i));
export function habitCell(habit, date, today) {
  const due = scheduled(habit, date);
  const count = habit.logs[date] > 0 ? 1 : 0;
  const streak = count ? habitStreak(habit, date) : 0;
  const threshold = HABIT_MILESTONES.find((days) => days >= streak) || 365;
  return {
    count,
    due,
    future: date > today,
    editable: due && date <= today,
    streak,
    threshold,
    fraction: count ? Math.min(1, streak / threshold) : 0,
    complete: count === 1,
    missed: habit.frequency !== 'weekly' && due && date < today && count === 0,
  };
}
export function habitProgress(habit, date, weekStart = 1) {
  const dates =
    habit.frequency === 'weekly'
      ? Array.from({ length: 7 }, (_, i) => shiftDay(weekOf(date, weekStart), i))
      : [date];
  const count = dates.reduce(
    (sum, day) => sum + (scheduled(habit, day) && habit.logs[day] > 0 ? 1 : 0),
    0,
  );
  const target = habit.frequency === 'weekly' ? Math.min(7, habit.target) : 1;
  return {
    count,
    target,
    fraction: Math.min(1, count / target),
    complete: count >= target,
  };
}
export function logHabit(habit, date, amount) {
  if (!validDay(date) || date < habit.startDate || !Number.isInteger(amount))
    throw new Error('invalid');
  const logs = { ...habit.logs };
  if (amount > 0) logs[date] = 1;
  else delete logs[date];
  return { ...habit, logs };
}
export function habitStreaks(habit, today) {
  const dates = Object.keys(habit.logs)
    .filter((day) => day <= today && scheduled(habit, day) && habit.logs[day] > 0)
    .sort();
  let run = 0;
  let best = 0;
  let previous = null;
  for (const date of dates) {
    let next = previous && shiftDay(previous, 1);
    // Rest days do not interrupt a selected-weekday habit.
    while (next && next < date && !scheduled(habit, next)) next = shiftDay(next, 1);
    run = next === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  let next = previous && shiftDay(previous, 1);
  while (next && next < today && !scheduled(habit, next)) next = shiftDay(next, 1);
  const current = previous === today || (next && next >= today) ? run : 0;
  return { current, best };
}
export const habitStreak = (habit, today) => habitStreaks(habit, today).current;
export const habitMilestone = (habit, today) => {
  const { best } = habitStreaks(habit, today);
  return HABIT_MILESTONES.filter((days) => days <= best).at(-1) || 0;
};

/** A confirmation is a state assignment, so simultaneous confirmations cannot add up. */
export function confirmHabit(habit, date, complete, expected, today = habitDay()) {
  if (!validDay(date) || date > today || !scheduled(habit, date)) throw new Error('invalid-day');
  if (habit.logs[date] > 0 !== expected) throw new Error('habit-changed');
  return logHabit(habit, date, complete ? 1 : 0);
}

export function habitMonths(habit, year, today) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const count =
      month > today.slice(0, 7)
        ? null
        : Object.entries(habit.logs).filter(
            ([date, amount]) =>
              date.startsWith(month) && date <= today && scheduled(habit, date) && amount > 0,
          ).length;
    return { month, count };
  });
}
