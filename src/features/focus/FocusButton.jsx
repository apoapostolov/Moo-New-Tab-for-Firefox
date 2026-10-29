import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { useState, useEffect } from 'react';
import { MdCenterFocusStrong } from 'react-icons/md';
import EventBus from 'utils/eventbus';
import {
  advanceFocus,
  focusCounter,
  readFocusSession,
  startFocus,
  saveFocusSession,
} from './focusStore';

const sessionKey = (session) =>
  session ? `${session.phase}:${session.started}:${session.end}:${Boolean(session.paused)}` : null;

export default function FocusButton({ fontSize }) {
  useTranslationVersion();
  const [session, setSession] = useState(() => advanceFocus(readFocusSession()));
  const [now, setNow] = useState(Date.now);
  const [armedKey, setArmedKey] = useState(null);
  const armed = Boolean(session && armedKey === sessionKey(session));

  useEffect(() => {
    const sync = () => {
      setSession(advanceFocus(readFocusSession()));
      setNow(Date.now());
    };
    EventBus.on('focus', sync);
    window.addEventListener('storage', sync);
    const timer = setInterval(sync, 1000);
    return () => {
      clearInterval(timer);
      EventBus.off('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!armedKey) return;
    const timer = setTimeout(() => setArmedKey(null), 4000);
    return () => clearTimeout(timer);
  }, [armedKey]);

  const counter = focusCounter(session, now);
  const phase =
    session?.phase === 'longBreak'
      ? uiText('focus_long_break')
      : session?.phase === 'break'
        ? uiText('focus_break')
        : uiText('focus_title');
  const label = armed
    ? uiText('focus_confirm_end')
    : session
      ? uiText('focus_end')
      : uiText('focus_start');
  return (
    <button
      type="button"
      className={`navbarButton focusControl${session ? ' focusSelected' : ''}${armed ? ' focusArmed' : ''}`}
      style={{ fontSize }}
      aria-label={label}
      aria-description={
        session
          ? uiText(session.paused ? 'focus_counter_paused' : 'focus_counter', {
              phase,
              time: counter,
            })
          : undefined
      }
      aria-pressed={Boolean(session)}
      title={
        armed
          ? uiText('focus_end_again')
          : session
            ? uiText('focus_counter_hint', { phase, time: counter })
            : uiText('focus_start')
      }
      onBlur={() => setArmedKey(null)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setArmedKey(null);
      }}
      onClick={() => {
        const current = advanceFocus(readFocusSession());
        if (!current) {
          setArmedKey(null);
          startFocus();
        } else if (armedKey === sessionKey(current)) {
          setArmedKey(null);
          saveFocusSession(null);
        } else setArmedKey(sessionKey(current));
      }}
    >
      <MdCenterFocusStrong aria-hidden="true" />
      {session && (
        <span className="focusCounter" aria-hidden="true">
          {counter}
        </span>
      )}
    </button>
  );
}
