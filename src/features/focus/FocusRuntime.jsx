import { useEffect } from 'react';
import EventBus from 'utils/eventbus';
import { advanceFocus, isFocusing, readFocusSession, saveFocusSession } from './focusStore';
import { desiredBackgroundSource } from 'features/background/fallback';
import { isFocusWorkspace } from './workspace';
import 'scss/features.scss';

export default function FocusRuntime() {
  useEffect(() => {
    let source = desiredBackgroundSource();
    let workspace = isFocusWorkspace();
    const sync = () => {
      const current = readFocusSession();
      const next = advanceFocus(current);
      if (next !== current) {
        saveFocusSession(next);
      }
      document.body.classList.toggle('focusActive', isFocusing(next));
      const active = isFocusWorkspace();
      if (active !== workspace) {
        workspace = active;
        EventBus.emit('workspace', active);
      }
      const selected = desiredBackgroundSource();
      if (selected !== source) {
        source = selected;
        EventBus.emit('refresh', 'backgroundsource');
      }
    };
    sync();
    const timer = setInterval(sync, 1000);
    EventBus.on('focus', sync);
    EventBus.on('refresh', sync);
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      EventBus.off('focus', sync);
      EventBus.off('refresh', sync);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', sync);
      document.body.classList.remove('focusActive');
    };
  }, []);
  return null;
}
