import { uiText } from 'lib/translations';

export const githubKind = (item, view) =>
  item.kind || (view === 'actions' ? 'action' : view === 'issues' ? 'issue' : 'pull');
export function githubStatus(item, view) {
  const kind = githubKind(item, view);
  const state = item.draft ? 'draft' : item.state;
  if (kind !== 'action') {
    const key =
      state === 'draft'
        ? 'github_draft'
        : state === 'merged'
          ? 'github_state_merged'
          : state === 'closed'
            ? 'github_state_closed'
            : 'github_state_open';
    return {
      kind,
      state,
      tone:
        state === 'draft'
          ? 'muted'
          : state === 'merged'
            ? 'merged'
            : state === 'closed'
              ? kind === 'issue' && item.reason !== 'not_planned'
                ? 'merged'
                : 'danger'
              : 'success',
      label: uiText(key),
    };
  }
  const known = [
    'success',
    'failure',
    'cancelled',
    'in_progress',
    'queued',
    'waiting',
    'requested',
    'pending',
    'neutral',
    'skipped',
    'timed_out',
    'action_required',
    'startup_failure',
    'stale',
    'completed',
  ];
  const value = known.includes(state) ? state : 'unknown';
  return {
    kind,
    state: value,
    tone:
      value === 'success'
        ? 'success'
        : ['failure', 'timed_out', 'action_required', 'startup_failure'].includes(value)
          ? 'danger'
          : ['in_progress', 'queued', 'waiting', 'requested', 'pending'].includes(value)
            ? 'pending'
            : 'muted',
    label: uiText(`github_state_${value}`),
  };
}

/** Resolve body links in repository context; executable and credential-bearing URLs are rejected. */
export function githubBodyUrl(value, item, image = false) {
  try {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const root = `https://github.com/${item.repository}/`;
    const base = raw.startsWith('#') ? item.url : `${root}blob/HEAD/`;
    const url = new URL(raw, base);
    if (
      url.username ||
      url.password ||
      !(image ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:']).includes(url.protocol)
    )
      return null;
    if (image && url.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/blob\//.test(url.pathname))
      url.searchParams.set('raw', 'true');
    return url.href;
  } catch {
    return null;
  }
}
