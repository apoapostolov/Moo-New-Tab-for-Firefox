import { useEffect, useRef, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import { WidgetShell, IconButton, EmptyState } from '../widgetKit/WidgetKit';
import HabitDialog from './HabitDialog';
import HabitTable from './HabitTable';
import HabitDetails from './HabitDetails';
import {
  habitDay,
  habitSettings,
  readHabits,
  updateHabits,
  scheduled,
  confirmHabit,
  habitWeek,
  weekOf,
  shiftDay,
  MAX_HABITS,
} from './habitStore';
import './habits.scss';

export default function Habits() {
  const { language } = useTranslationVersion();
  const [state, setState] = useState(readHabits);
  const [today, setToday] = useState(habitDay);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(null);
  const [reference, setReference] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [armed, setArmed] = useState(null);
  const saving = useRef(false);
  const [, redraw] = useState(0);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(null), 4000);
    const cancel = (event) => {
      if (
        event.key === 'Escape' ||
        (event.type === 'pointerdown' && !event.target.closest?.('.habitCell'))
      )
        setArmed(null);
    };
    document.addEventListener('keydown', cancel);
    document.addEventListener('pointerdown', cancel);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', cancel);
      document.removeEventListener('pointerdown', cancel);
    };
  }, [armed]);
  const ignoreFocus = useRef(false);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const close = (restore = false) => {
    cancelClose();
    setActive(null);
    setPinned(false);
    if (restore && reference?.isConnected) {
      ignoreFocus.current = true;
      reference.focus();
      globalThis.queueMicrotask(() => {
        ignoreFocus.current = false;
      });
    }
  };
  const leave = () => {
    if (pinned) return;
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) {
        setActive(null);
        setPinned(false);
      }
    }, 180);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!active) return undefined;
    const outside = (event) => {
      if (!panelRef.current?.contains(event.target) && !reference?.contains(event.target)) {
        setActive(null);
        setPinned(false);
      }
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setActive(null);
        setPinned(false);
        if (reference?.isConnected) {
          ignoreFocus.current = true;
          reference.focus();
          globalThis.queueMicrotask(() => {
            ignoreFocus.current = false;
          });
        }
      }
    };
    document.addEventListener('pointerdown', outside);
    const focusOutside = (event) => {
      if (!event.target.closest?.('.habitsWidget') && !panelRef.current?.contains(event.target)) {
        setActive(null);
        setPinned(false);
      }
    };
    document.addEventListener('focusin', focusOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', focusOutside);
      document.removeEventListener('keydown', escape);
    };
  }, [active, reference]);
  useEffect(() => {
    if (pinned) panelRef.current?.focus();
  }, [pinned, active]);
  useEffect(() => {
    const sync = () => {
      setState(readHabits());
      setToday(habitDay());
      redraw((n) => n + 1);
    };
    const refresh = (category) => {
      if (['habits', 'other'].includes(category)) sync();
    };
    const storage = (event) => {
      if (event.key?.startsWith('habits')) sync();
    };
    const visible = () => {
      if (!document.hidden) sync();
    };
    EventBus.on('habits', sync);
    EventBus.on('refresh', refresh);
    window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', visible);
    const tick = setInterval(visible, 30000);
    return () => {
      EventBus.off('habits', sync);
      EventBus.off('refresh', refresh);
      window.removeEventListener('storage', storage);
      document.removeEventListener('visibilitychange', visible);
      clearInterval(tick);
    };
  }, []);
  const date = today;
  const settings = habitSettings();
  const currentWeek = weekOf(today, settings.weekStart);
  const week =
    selectedWeek && selectedWeek < currentWeek
      ? weekOf(selectedWeek, settings.weekStart)
      : currentWeek;
  const days = habitWeek(week, settings.weekStart);
  const historical = week < currentWeek;
  const firstWeek = state.habits
    .filter((habit) => !habit.archived)
    .reduce((first, habit) => (habit.startDate < first ? habit.startDate : first), today);
  const due = state.habits.filter((habit) => scheduled(habit, date));
  const complete = due.filter((habit) => habit.logs[date] > 0).length;
  const visible = state.habits.filter(
    (habit) =>
      !habit.archived &&
      days.some((day) => scheduled(habit, day)) &&
      (historical ||
        localStorage.getItem('habitsShowCompleted') !== 'false' ||
        !(habit.logs[date] > 0)),
  );
  const sort = localStorage.getItem('habitsSort') || 'manual';
  if (sort === 'name') visible.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'incomplete')
    visible.sort((a, b) => Number(a.logs[date] > 0) - Number(b.logs[date] > 0));
  const limit = Math.max(1, Math.min(30, Number(localStorage.getItem('habitsLimit')) || 8));
  const rows = visible.slice(0, limit);
  const detailHabit = active && rows.find((habit) => habit.id === active.id);
  const open = (habit, day, anchor, pin = false) => {
    if (ignoreFocus.current) return;
    cancelClose();
    setActive({ id: habit.id, date: day || (historical ? days.at(-1) : date) });
    setReference(anchor);
    setPinned(pin);
  };
  const navigateWeek = (direction) => {
    close();
    setArmed(null);
    const next = shiftDay(week, direction * 7);
    setSelectedWeek(next >= currentWeek ? null : next);
  };
  const confirm = async (habit, day) => {
    if (saving.current) return;
    const completed = habit.logs[day] > 0;
    if (!armed || armed.id !== habit.id || armed.date !== day || armed.completed !== completed) {
      setArmed({ id: habit.id, date: day, completed });
      return;
    }
    saving.current = true;
    setArmed(null);
    setPending(true);
    setError('');
    try {
      await updateHabits((current) =>
        current.map((item) =>
          item.id === habit.id ? confirmHabit(item, day, !completed, completed) : item,
        ),
      );
    } catch (error) {
      setError(
        uiText(error.message === 'habit-changed' ? 'habits_day_changed' : 'widget_save_error'),
      );
    } finally {
      saving.current = false;
      setPending(false);
    }
  };
  return (
    <WidgetShell
      widget="habits"
      className="habitsWidget"
      showSettings={false}
      title={uiText('habits_title')}
      error={error}
      actions={
        <IconButton
          label={uiText('habits_add')}
          disabled={state.damaged || state.habits.length >= MAX_HABITS}
          onClick={(event) => {
            close();
            setReference(event.currentTarget);
            setEditing({});
          }}
        >
          <MdAdd />
        </IconButton>
      }
    >
      {state.damaged ? (
        <p className="wkNotice" role="alert">
          {uiText('habits_damaged')}
        </p>
      ) : !state.habits.length ? (
        <EmptyState
          widget="habits"
          onAction={() => setEditing({})}
          actionLabel={uiText('habits_add')}
        >
          {uiText('habits_empty')}
        </EmptyState>
      ) : (
        <>
          <div className="habitSummary">
            <progress
              max={due.length || 1}
              value={complete}
              aria-label={uiText('habits_summary', { done: complete, total: due.length })}
            />
            <span>
              {complete}/{due.length} · {Math.round((complete / (due.length || 1)) * 100)}%
            </span>
          </div>
          <HabitTable
            habits={rows}
            days={days}
            today={today}
            locale={language.replaceAll('_', '-')}
            pending={pending}
            armed={armed}
            onPrevious={() => navigateWeek(-1)}
            onNext={() => navigateWeek(1)}
            canPrevious={week > weekOf(firstWeek, settings.weekStart)}
            canNext={historical}
            onHover={(habit, day, anchor) => {
              if (!pinned) open(habit, day, anchor);
            }}
            onFocus={open}
            onLeave={leave}
            onName={(habit, day, anchor) => {
              if (pinned && active?.id === habit.id) close();
              else open(habit, day, anchor, true);
            }}
            onCell={confirm}
          />
          {!rows.length && (
            <p className="wkNotice">
              {uiText(!historical && due.length ? 'habits_all_done' : 'habits_rest_day')}
            </p>
          )}
          {visible.length > limit && (
            <p className="wkUpdated">
              {uiText('widget_showing', { shown: limit, total: visible.length })}
            </p>
          )}
        </>
      )}
      {detailHabit && (
        <HabitDetails
          habit={detailHabit}
          date={active.date}
          today={today}
          locale={language.replaceAll('_', '-')}
          weekStart={settings.weekStart}
          reference={reference}
          panelRef={panelRef}
          onEnter={cancelClose}
          onLeave={leave}
          onClose={() => close(true)}
          onEdit={(habit) => {
            close();
            setEditing(habit);
          }}
        />
      )}
      {editing && (
        <HabitDialog
          initial={editing.id ? editing : null}
          onClose={() => {
            setEditing(null);
            if (reference?.isConnected) {
              ignoreFocus.current = true;
              reference.focus();
              globalThis.queueMicrotask(() => {
                ignoreFocus.current = false;
              });
            }
          }}
          onSave={(value) =>
            updateHabits((current) =>
              editing.id
                ? current.map((habit) =>
                    habit.id === value.id ? { ...value, logs: habit.logs } : habit,
                  )
                : [...current, value],
            )
          }
        />
      )}
    </WidgetShell>
  );
}
