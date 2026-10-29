import { useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdTimeline } from 'react-icons/md';
import { uiText } from 'lib/translations';
import { IconButton } from '../widgetKit/WidgetKit';
import { habitMonths } from './habitStore';

export function monthCurve(months) {
  const max = Math.max(1, ...months.map(({ count }) => count || 0));
  const points = months
    .filter(({ count }) => count !== null)
    .map(({ count }, index) => ({
      x: 4 + (index * 232) / 11,
      y: 44 - (count / max) * 36,
    }));
  return points.reduce((path, point, index) => {
    if (!index) return `M${point.x},${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path} C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
  }, '');
}

export default function HabitHistory({ habit, today, locale }) {
  const currentYear = Number(today.slice(0, 4));
  const [selectedYear, setYear] = useState(currentYear);
  const [selectedMonth, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const year = Math.min(currentYear, selectedYear);
  const months = habitMonths(habit, year, today);
  const label = (month) =>
    new Date(`${month}-01T12:00:00Z`).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  const selected =
    months[Math.min(selectedMonth, year === currentYear ? Number(today.slice(5, 7)) - 1 : 11)];
  const max = Math.max(1, ...months.map(({ count }) => count || 0));
  return (
    <figure className="habitHistory">
      <figcaption>
        <span>
          <MdTimeline aria-hidden="true" />
          {uiText('habits_monthly_confirmations')}
        </span>
        <span className="habitHistoryYear">
          <IconButton
            label={uiText('habits_previous_year')}
            disabled={year <= Number(habit.startDate.slice(0, 4))}
            onClick={() => setYear(year - 1)}
          >
            <MdChevronLeft />
          </IconButton>
          <strong>{year}</strong>
          <IconButton
            label={uiText('habits_next_year')}
            disabled={year >= currentYear}
            onClick={() => setYear(year + 1)}
          >
            <MdChevronRight />
          </IconButton>
        </span>
      </figcaption>
      <p className="habitHistoryValue" aria-live="polite">
        {uiText('habits_month_count', { month: label(selected.month), count: selected.count })}
      </p>
      <svg viewBox="0 0 240 52" role="group" aria-label={uiText('habits_monthly_confirmations')}>
        <path className="habitHistoryBaseline" d="M4,44 H236" />
        <path className="habitHistoryLine" d={monthCurve(months)} />
        {months.map(({ month, count }, index) =>
          count === null ? null : (
            <g key={month}>
              <circle
                className="habitHistoryPoint"
                cx={4 + (index * 232) / 11}
                cy={44 - (count / max) * 36}
                r={month === selected.month ? 3 : 2}
              />
              <rect
                x={(index * 232) / 11 - 6}
                y="0"
                width="21"
                height="52"
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={uiText('habits_month_count', { month: label(month), count })}
                onMouseEnter={() => setMonth(index)}
                onFocus={() => setMonth(index)}
              >
                <title>{uiText('habits_month_count', { month: label(month), count })}</title>
              </rect>
            </g>
          ),
        )}
      </svg>
      <div className="habitHistoryAxis" aria-hidden="true">
        {months.map(({ month }) => (
          <span key={month}>
            {new Date(`${month}-01T12:00:00Z`).toLocaleDateString(locale, {
              month: 'narrow',
              timeZone: 'UTC',
            })}
          </span>
        ))}
      </div>
    </figure>
  );
}
