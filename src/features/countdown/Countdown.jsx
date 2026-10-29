import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDeleteOutline } from 'react-icons/md';
import WidgetCard, { WidgetHeader } from 'components/Elements/WidgetCard/WidgetCard';
import Markdown, { checklistLabel as markdownLabel } from 'features/scratch/Markdown';
import EventBus from 'utils/eventbus';
import CountdownModal from './CountdownModal';
import CountdownReadout from './CountdownReadout';
import { readCountdownState } from './countdownStore';
import './countdown.scss';

export default function Countdown() {
  useTranslationVersion();
  const [state, setState] = useState(readCountdownState);
  const [editing, setEditing] = useState(null);
  const [armed, setArmed] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setState(readCountdownState());
    window.addEventListener('storage', sync);
    EventBus.on('countdowns', sync);
    return () => {
      window.removeEventListener('storage', sync);
      EventBus.off('countdowns', sync);
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  const commit = (items) => {
    if (readCountdownState().damaged) throw new Error(uiText('countdown_damaged'));
    localStorage.setItem('countdowns', JSON.stringify(items));
    setState({ items, damaged: false });
    EventBus.emit('countdowns');
  };
  return (
    <WidgetCard widget="countdown" className="countdownCard">
      <WidgetHeader>
        <span className="countdownLabel">{uiText('countdown_title')}</span>
        <button
          type="button"
          className="countdownIcon"
          title={uiText('countdown_add')}
          aria-label={uiText('countdown_add')}
          disabled={state.damaged || state.items.length >= 100}
          onClick={() => setEditing({})}
        >
          <MdAdd />
        </button>
      </WidgetHeader>
      {state.damaged ? (
        <p role="alert">{uiText('countdown_damaged')}</p>
      ) : state.items.length === 0 ? (
        <p className="countdownEmpty">{uiText('countdown_empty')}</p>
      ) : (
        state.items.map((item) => (
          <article className="countdownItem" key={item.id}>
            <CountdownReadout value={item} />
            {item.text && (
              <div className="scratchNoteBody countdownMarkdown">
                <Markdown text={item.text} />
              </div>
            )}
            <div className="countdownItemActions">
              <button
                type="button"
                className="countdownIcon"
                aria-label={uiText('edit_named', {
                  name: markdownLabel(item.title) || uiText('countdown_label'),
                })}
                onClick={() => setEditing(item)}
              >
                <MdEdit />
              </button>
              <button
                type="button"
                className="countdownIcon"
                aria-label={uiText(armed === item.id ? 'confirm_remove_named' : 'remove_named', {
                  name: markdownLabel(item.title) || uiText('countdown_label'),
                })}
                onClick={() => {
                  if (armed !== item.id) {
                    setArmed(item.id);
                    return;
                  }
                  try {
                    commit(state.items.filter((entry) => entry.id !== item.id));
                    setArmed(null);
                    setError('');
                  } catch (error) {
                    setError(error.message);
                  }
                }}
              >
                {armed === item.id ? uiText('remove_confirm') : <MdDeleteOutline />}
              </button>
            </div>
          </article>
        ))
      )}
      {error && <p role="alert">{error}</p>}
      {editing && (
        <CountdownModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(value) => {
            const latest = readCountdownState();
            if (latest.damaged || (!editing.id && latest.items.length >= 100))
              throw new Error(uiText('countdown_limit'));
            if (editing.id && !latest.items.some((item) => item.id === editing.id))
              throw new Error(uiText('countdown_removed_elsewhere'));
            commit(
              editing.id
                ? latest.items.map((item) =>
                    item.id === editing.id ? { ...item, ...value } : item,
                  )
                : [...latest.items, { id: crypto.randomUUID(), ...value }],
            );
            setEditing(null);
          }}
        />
      )}
    </WidgetCard>
  );
}
