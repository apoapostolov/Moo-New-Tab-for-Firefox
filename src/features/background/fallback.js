import { progressPosition } from 'utils/clockDays';
import { convertTimezone } from 'utils/date';
import { advanceFocus, readFocusSession, isFocusing } from 'features/focus/focusStore';

export function shouldUseFallback(now = new Date()) {
  if (
    localStorage.getItem('focusFallbackBackground') === 'true' &&
    isFocusing(advanceFocus(readFocusSession(), now.getTime()))
  )
    return true;
  const timezone = localStorage.getItem('timezone');
  const zoned = timezone && timezone !== 'auto' ? convertTimezone(now, timezone) : now;
  return (
    localStorage.getItem('percentageFallbackBackground') === 'true' &&
    localStorage.getItem('timeType') === 'percentageComplete' &&
    Boolean(progressPosition(zoned))
  );
}
export const desiredBackgroundSource = () =>
  shouldUseFallback()
    ? `fallback:${localStorage.getItem('fallbackBackgroundType') || 'none'}`
    : 'primary';
