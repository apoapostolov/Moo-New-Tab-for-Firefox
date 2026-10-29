import { useEffect, useState } from 'react';
import {
  MdAdd,
  MdEdit,
  MdArchive,
  MdUnarchive,
  MdDeleteOutline,
  MdArrowUpward,
  MdArrowDownward,
} from 'react-icons/md';
import { Header, Group, Row, Content, Action } from 'components/Layout/Settings';
import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import {
  OptionSelect,
  OptionToggle,
  OptionInput,
  IconButton,
  numberChoices,
} from '../widgetKit/WidgetKit';
import HabitDialog from './HabitDialog';
import { readHabits, updateHabits, validZone, MAX_HABITS } from './habitStore';

export default function HabitOptions() {
  useTranslationVersion();
  const [state, setState] = useState(readHabits);
  const [editing, setEditing] = useState(null);
  const [armed, setArmed] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setState(readHabits());
    EventBus.on('habits', sync);
    window.addEventListener('storage', sync);
    return () => {
      EventBus.off('habits', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  const change = async (action) => {
    try {
      await updateHabits(action);
      setError('');
    } catch {
      setError(uiText('widget_save_error'));
    }
  };
  const move = (id, delta) =>
    change((current) => {
      const next = [...current];
      const index = next.findIndex((habit) => habit.id === id);
      if (index + delta < 0 || index + delta >= next.length) return current;
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  return (
    <>
      <Header
        title={uiText('habits_title')}
        setting="habitsEnabled"
        category="widgets"
        visibilityToggle
      />
      <Group>
        <WidgetSurface setting="surfaceHabits" category="habits" />
        <OptionSelect
          category="habits"
          name="habitsSort"
          title={uiText('widget_sort')}
          items={['manual', 'name', 'incomplete'].map((value) => ({
            value,
            text: uiText(`habits_sort_${value}`),
          }))}
        />
        <OptionSelect
          category="habits"
          name="habitsLimit"
          title={uiText('widget_item_limit')}
          items={numberChoices([4, 6, 8, 12, 20, 30])}
        />
        <OptionToggle
          category="habits"
          name="habitsShowCompleted"
          title={uiText('habits_show_completed')}
        />
        <OptionToggle
          category="habits"
          name="habitsShowStreak"
          title={uiText('habits_show_streak')}
          hint={uiText('habits_streak_hint')}
        />
      </Group>
      <Group>
        <Row>
          <Content title={uiText('habits_calendar')} subtitle={uiText('habits_calendar_hint')} />
        </Row>
        <OptionInput
          category="habits"
          name="habitsTimeZone"
          title={uiText('habits_timezone')}
          hint={uiText('habits_timezone_hint')}
          validate={validZone}
          placeholder="local"
          maxLength={100}
        />
        <OptionInput
          category="habits"
          name="habitsDayStart"
          title={uiText('habits_day_start')}
          hint={uiText('habits_day_start_hint')}
          type="time"
          validate={(value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)}
        />
        <OptionSelect
          category="habits"
          name="habitsWeekStart"
          title={uiText('habits_week_start')}
          items={[
            { value: '1', text: uiText('habits_monday') },
            { value: '0', text: uiText('habits_sunday') },
          ]}
        />
      </Group>
      <Group>
        <Row>
          <Content title={uiText('habits_manage')} subtitle={uiText('habits_manage_hint')} />
          <Action>
            <button
              className="featureButton"
              type="button"
              disabled={state.damaged || state.habits.length >= MAX_HABITS}
              onClick={() => setEditing({})}
            >
              <MdAdd /> {uiText('habits_add')}
            </button>
          </Action>
        </Row>
        {state.damaged ? (
          <Row>
            <Content subtitle={uiText('habits_damaged')} />
          </Row>
        ) : (
          <Row>
            <div className="wkManageList">
              {state.habits.map((habit, index) => (
                <div className="wkManageRow" key={habit.id}>
                  <span className="wkManageTitle">
                    {habit.title}
                    <small>
                      {habit.frequency === 'weekly'
                        ? uiText('habits_days_week', { count: Math.min(7, habit.target) })
                        : uiText(`habits_${habit.frequency}`)}
                      {habit.archived && ` · ${uiText('habits_archived')}`}
                    </small>
                  </span>
                  <span className="wkManageActions">
                    <IconButton
                      label={uiText('habits_move_up', { name: habit.title })}
                      disabled={index === 0}
                      onClick={() => move(habit.id, -1)}
                    >
                      <MdArrowUpward />
                    </IconButton>
                    <IconButton
                      label={uiText('habits_move_down', { name: habit.title })}
                      disabled={index === state.habits.length - 1}
                      onClick={() => move(habit.id, 1)}
                    >
                      <MdArrowDownward />
                    </IconButton>
                    <IconButton
                      label={uiText('edit_named', { name: habit.title })}
                      onClick={() => setEditing(habit)}
                    >
                      <MdEdit />
                    </IconButton>
                    <IconButton
                      label={uiText(habit.archived ? 'habits_restore' : 'habits_archive', {
                        name: habit.title,
                      })}
                      onClick={() =>
                        change((current) =>
                          current.map((item) =>
                            item.id === habit.id ? { ...item, archived: !item.archived } : item,
                          ),
                        )
                      }
                    >
                      {habit.archived ? <MdUnarchive /> : <MdArchive />}
                    </IconButton>
                    <IconButton
                      label={uiText(armed === habit.id ? 'confirm_remove_named' : 'remove_named', {
                        name: habit.title,
                      })}
                      className={`gwIconButton wkIcon${armed === habit.id ? ' wkArmed' : ''}`}
                      onClick={() => {
                        if (armed !== habit.id) setArmed(habit.id);
                        else {
                          change((current) => current.filter((item) => item.id !== habit.id));
                          setArmed(null);
                        }
                      }}
                    >
                      <MdDeleteOutline />
                    </IconButton>
                  </span>
                </div>
              ))}
              {!state.habits.length && <p>{uiText('habits_empty')}</p>}
            </div>
          </Row>
        )}
        {error && (
          <Row>
            <p role="alert">{error}</p>
          </Row>
        )}
      </Group>
      {editing && (
        <HabitDialog
          initial={editing.id ? editing : null}
          onClose={() => setEditing(null)}
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
    </>
  );
}
