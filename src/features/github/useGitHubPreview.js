import { useEffect, useRef, useState } from 'react';

export default function useGitHubPreview(scope) {
  const [active, setActive] = useState(null);
  const [previousScope, setPreviousScope] = useState(scope);
  if (scope !== previousScope) {
    setPreviousScope(scope);
    setActive(null);
  }
  const panelRef = useRef(null);
  const timer = useRef(null);
  const ignoreFocus = useRef(false);
  const enter = () => clearTimeout(timer.current);
  const close = (restore = false) => {
    enter();
    setActive(null);
    if (restore && active?.trigger?.isConnected) {
      ignoreFocus.current = true;
      active.trigger.focus();
      globalThis.queueMicrotask(() => {
        ignoreFocus.current = false;
      });
    }
  };
  const open = (item, anchor, pin = false) => {
    if (ignoreFocus.current || (!pin && active?.pinned && active.scope === scope)) return;
    enter();
    if (pin && active?.pinned && active.id === item.id && active.repository === item.repository)
      return close(true);
    setActive({
      scope,
      id: item.id,
      repository: item.repository,
      anchor: anchor.closest('.githubRow') || anchor,
      trigger: anchor,
      pinned: pin,
    });
  };
  const leave = () => {
    if (active?.pinned) return;
    enter();
    timer.current = setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) setActive(null);
    }, 220);
  };
  useEffect(() => () => clearTimeout(timer.current), [scope]);
  useEffect(() => {
    if (!active || active.scope !== scope) return undefined;
    if (active.pinned) panelRef.current?.focus();
    const outside = (event) => {
      if (event.type === 'focusin' && event.target.closest?.('.githubWidget')) return;
      if (!active.anchor.contains(event.target) && !panelRef.current?.contains(event.target))
        setActive(null);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setActive(null);
        if (active.trigger?.isConnected) {
          ignoreFocus.current = true;
          active.trigger.focus();
          globalThis.queueMicrotask(() => {
            ignoreFocus.current = false;
          });
        }
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('focusin', outside);
    };
  }, [active, scope]);
  return { active: active?.scope === scope ? active : null, panelRef, open, close, enter, leave };
}
