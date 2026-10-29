import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { MdEdit, MdClose, MdCheck } from 'react-icons/md';
import { uiText } from 'lib/translations';
import { IconButton } from '../widgetKit/WidgetKit';
import useSidePreview from '../widgetKit/useSidePreview';
import usePreviewScroll from '../widgetKit/usePreviewScroll';
import { habitProgress, habitStreaks, HABIT_MILESTONES } from './habitStore';
import HabitBadge from './HabitBadge';
import HabitHistory from './HabitHistory';

export default function HabitDetails({
  habit,
  date,
  today,
  locale,
  weekStart,
  reference,
  panelRef,
  onEnter,
  onLeave,
  onClose,
  onEdit,
}) {
  const body = useRef(null);
  const style = useSidePreview(reference, panelRef, 280);
  usePreviewScroll(body, `${habit.id}:${date}`);
  const progress = habitProgress(habit, date, weekStart);
  const streak = habitStreaks(habit, today);
  return createPortal(
    <div
      className="habitDetailsPanel"
      popover="manual"
      role="dialog"
      aria-label={uiText('habits_details', { name: habit.title })}
      tabIndex={-1}
      ref={panelRef}
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header>
        <strong>{habit.title}</strong>
        <IconButton
          label={uiText('edit_named', { name: habit.title })}
          onClick={() => onEdit(habit)}
        >
          <MdEdit />
        </IconButton>
        <IconButton label={uiText('close_bbfa77')} onClick={onClose}>
          <MdClose />
        </IconButton>
      </header>
      <div className="habitDetailsScroll" ref={body}>
        {habit.description && <p className="habitDetailDescription">{habit.description}</p>}
        <div className="habitDetailScheduleRow">
          <span>{uiText(`habits_${habit.frequency}`)}</span>
          <time dateTime={date}>
            {new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            })}
          </time>
        </div>
        <p className="habitDetailStatus">
          {date <= today && habit.logs[date] > 0 && <MdCheck aria-hidden="true" />}
          {uiText(
            date > today
              ? 'habits_future_day'
              : habit.logs[date] > 0
                ? 'habits_day_confirmed'
                : 'habits_day_unconfirmed',
          )}
        </p>
        {habit.frequency === 'weekly' && (
          <>
            <p className="habitDetailWeekly">
              {uiText('habits_week_days', { count: progress.count, target: progress.target })}
            </p>
          </>
        )}
        <HabitHistory key={habit.id} habit={habit} today={today} locale={locale} />
        {localStorage.getItem('habitsShowStreak') !== 'false' && (
          <footer className="habitMilestones">
            <p>{uiText('habits_streak_stats', { current: streak.current, best: streak.best })}</p>
            <div aria-label={uiText('habits_milestones')} role="group">
              {HABIT_MILESTONES.map((days) => (
                <HabitBadge key={days} days={days} earned={streak.best >= days} />
              ))}
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
