import { useEffect, useState } from 'react';
import EventBus from 'utils/eventbus';
import { isFocusWorkspace } from './workspace';

export default function useFocusWorkspace() {
  const [active, setActive] = useState(isFocusWorkspace);
  useEffect(() => {
    const sync = () => setActive(isFocusWorkspace());
    sync();
    EventBus.on('workspace', sync);
    EventBus.on('focus', sync);
    EventBus.on('refresh', sync);
    window.addEventListener('storage', sync);
    return () => {
      EventBus.off('workspace', sync);
      EventBus.off('focus', sync);
      EventBus.off('refresh', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return active;
}
