const localStamp = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const preserveManual = (current, next, manual) => {
  for (const key of manual) next[key] = current[key];
  return next;
};

/** The same mapping serves the delayed preview and the synchronous save path. */
export function eventFormFromNatural(current, parsed, manual = []) {
  if (!parsed?.understood) return current;
  const next = { ...current };
  if (parsed.notes !== null) next.description = parsed.notes;
  if (parsed.location !== null) next.location = parsed.location;
  if (parsed.calendarId) next.calendarId = parsed.calendarId;
  const scheduling =
    parsed.date || parsed.time || parsed.endTime || parsed.durationMinutes || parsed.allDay;
  if (scheduling) {
    const start = new Date(current.start);
    if (parsed.date)
      start.setFullYear(parsed.date.getFullYear(), parsed.date.getMonth(), parsed.date.getDate());
    const timed =
      !parsed.allDay &&
      Boolean(
        parsed.time || parsed.endTime || (parsed.durationMinutes && parsed.durationMinutes < 1440),
      );
    if (parsed.time) start.setHours(parsed.time.hours, parsed.time.minutes, 0, 0);
    next.allDay = !timed;
    next.start = localStamp(start);
    if (!timed) next.end = localStamp(parsed.endDate || parsed.date || start);
    else {
      const finish = new Date(start);
      if (parsed.endDate)
        finish.setFullYear(
          parsed.endDate.getFullYear(),
          parsed.endDate.getMonth(),
          parsed.endDate.getDate(),
        );
      if (parsed.endTime) {
        finish.setHours(parsed.endTime.hours, parsed.endTime.minutes, 0, 0);
        if (finish <= start && !parsed.endDate) finish.setDate(finish.getDate() + 1);
      } else finish.setTime(finish.getTime() + (parsed.durationMinutes || 60) * 60000);
      next.end = localStamp(finish);
    }
  }
  return preserveManual(current, next, manual);
}

export function taskFormFromNatural(current, parsed, manual = []) {
  if (!parsed?.understood) return current;
  const next = { ...current };
  if (parsed.date) next.due = localStamp(parsed.date).slice(0, 10);
  if (parsed.notes !== null) next.notes = parsed.notes;
  if (parsed.status) next.status = parsed.status;
  return preserveManual(current, next, manual);
}
