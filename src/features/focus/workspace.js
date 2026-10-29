import { progressPosition } from 'utils/clockDays';
import { convertTimezone } from 'utils/date';
import { advanceFocus, isFocusing, readFocusSession } from './focusStore';

export function isWorkShift(now = new Date()) {
  if (localStorage.getItem('timeType') !== 'percentageComplete') return false;
  const timezone = localStorage.getItem('timezone');
  const zoned = timezone && timezone !== 'auto' ? convertTimezone(now, timezone) : now;
  return Boolean(progressPosition(zoned));
}

/** Focus sessions and scheduled Progress shifts share one workspace. */
export function isFocusWorkspace(now = new Date()) {
  return isFocusing(advanceFocus(readFocusSession(), now.getTime())) || isWorkShift(now);
}

export const workspaceProfile = () => (isFocusWorkspace() ? 'focus' : 'standard');
