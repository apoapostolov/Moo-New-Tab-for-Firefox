import { MdCheck, MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { uiText } from 'lib/translations';
import { habitCell, habitMilestone } from './habitStore';
import HabitBadge from './HabitBadge';

export default function HabitTable({
  habits,
  days,
  today,
  locale,
  pending,
  armed,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  onHover,
  onFocus,
  onLeave,
  onName,
  onCell,
}) {
  const dateLabel = (day) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return (
    <div className="habitTableScroll">
      <table className="habitTable">
        <caption className="habitVisuallyHidden" aria-live="polite">
          {uiText('habits_table')} · {dateLabel(days[0])} – {dateLabel(days.at(-1))}
        </caption>
        <colgroup>
          <col className="habitNameColumn" />
          <col className="habitWeekNavColumn" />
          <col span={7} />
          <col className="habitWeekNavColumn" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="habitNameHeading">
              {uiText('habits_title')}
            </th>
            <th scope="col" className="habitWeekNavHeading">
              <button
                type="button"
                className="habitWeekNav"
                aria-label={uiText('habits_previous_week')}
                title={uiText('habits_previous_week')}
                disabled={pending || !canPrevious}
                onClick={onPrevious}
              >
                <MdChevronLeft aria-hidden="true" />
              </button>
            </th>
            {days.map((day) => (
              <th
                scope="col"
                key={day}
                aria-label={dateLabel(day)}
                className={day === today ? 'habitToday' : ''}
              >
                <time dateTime={day} title={dateLabel(day)}>
                  <span>
                    {new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, {
                      weekday: 'narrow',
                      timeZone: 'UTC',
                    })}
                  </span>
                  <small>{Number(day.slice(-2))}</small>
                </time>
              </th>
            ))}
            <th scope="col" className="habitWeekNavHeading">
              <button
                type="button"
                className="habitWeekNav"
                aria-label={uiText('habits_next_week')}
                title={uiText('habits_next_week')}
                disabled={pending || !canNext}
                onClick={onNext}
              >
                <MdChevronRight aria-hidden="true" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr
              key={habit.id}
              onMouseEnter={(event) => onHover(habit, null, event.currentTarget)}
              onMouseLeave={onLeave}
            >
              <th scope="row">
                <button
                  type="button"
                  className="habitName"
                  aria-haspopup="dialog"
                  onMouseEnter={(event) => onHover(habit, null, event.currentTarget)}
                  onFocus={(event) => onFocus(habit, null, event.currentTarget)}
                  onBlur={onLeave}
                  onClick={(event) => onName(habit, null, event.currentTarget)}
                >
                  <span className="habitNameText">{habit.title}</span>
                  {localStorage.getItem('habitsShowStreak') !== 'false' && (
                    <HabitBadge days={habitMilestone(habit, today)} />
                  )}
                </button>
              </th>
              <td aria-hidden="true" />
              {days.map((day) => {
                const cell = habitCell(habit, day, today);
                const isArmed =
                  armed?.id === habit.id && armed.date === day && armed.completed === cell.complete;
                const label = uiText(
                  isArmed
                    ? cell.complete
                      ? 'habits_confirm_undo'
                      : 'habits_confirm_done'
                    : cell.complete
                      ? 'habits_undo_day'
                      : 'habits_complete_day',
                  {
                    name: habit.title,
                    date: dateLabel(day),
                  },
                );
                const ringLabel = uiText('habits_ring_progress', {
                  count: cell.streak,
                  target: cell.threshold,
                });
                return (
                  <td key={day} className={day === today ? 'habitToday' : ''}>
                    {cell.due ? (
                      <button
                        type="button"
                        className={`habitCell${cell.complete ? ' isComplete' : ''}${cell.future ? ' isFuture' : ''}${isArmed ? (cell.complete ? ' isUndoArmed' : ' isConfirmArmed') : ''}`}
                        disabled={pending || !cell.editable}
                        aria-label={
                          cell.future ? `${label} · ${uiText('habits_future_day')}` : label
                        }
                        aria-pressed={cell.complete}
                        aria-description={ringLabel}
                        title={`${label} · ${ringLabel}`}
                        onMouseEnter={(event) => onHover(habit, day, event.currentTarget)}
                        onFocus={(event) => onFocus(habit, day, event.currentTarget)}
                        onBlur={onLeave}
                        onClick={(event) => onCell(habit, day, event.currentTarget)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="habitRingTrack" cx="12" cy="12" r="9" />
                          <circle
                            className="habitRingValue"
                            cx="12"
                            cy="12"
                            r="9"
                            pathLength="100"
                            strokeDasharray={`${cell.fraction * 100} 100`}
                            transform="rotate(-90 12 12)"
                          />
                        </svg>
                        {isArmed && cell.complete ? (
                          <MdClose className="habitCellMark" aria-hidden="true" />
                        ) : cell.complete && cell.streak === cell.threshold ? (
                          <HabitBadge days={cell.threshold} />
                        ) : cell.complete || isArmed ? (
                          <MdCheck className="habitCellMark" aria-hidden="true" />
                        ) : cell.missed ? (
                          <MdClose className="habitCellMark habitMissed" aria-hidden="true" />
                        ) : null}
                      </button>
                    ) : (
                      <span
                        className="habitRest"
                        aria-label={`${habit.title} · ${dateLabel(day)} · ${uiText('habits_not_scheduled')}`}
                      >
                        —
                      </span>
                    )}
                  </td>
                );
              })}
              <td aria-hidden="true" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
