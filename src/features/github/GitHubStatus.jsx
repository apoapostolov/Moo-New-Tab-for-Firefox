import {
  GoGitPullRequest,
  GoGitPullRequestClosed,
  GoGitPullRequestDraft,
  GoGitMerge,
  GoIssueOpened,
  GoIssueClosed,
  GoSkip,
  GoCheckCircle,
  GoXCircle,
  GoClock,
  GoSync,
} from 'react-icons/go';
import { githubStatus } from './githubPresentation';

export default function GitHubStatus({ item, view }) {
  const status = githubStatus(item, view);
  const Icon =
    status.kind === 'pull'
      ? status.state === 'draft'
        ? GoGitPullRequestDraft
        : status.state === 'merged'
          ? GoGitMerge
          : status.state === 'closed'
            ? GoGitPullRequestClosed
            : GoGitPullRequest
      : status.kind === 'issue'
        ? status.state === 'closed'
          ? item.reason === 'not_planned'
            ? GoSkip
            : GoIssueClosed
          : GoIssueOpened
        : status.tone === 'danger'
          ? GoXCircle
          : status.state === 'success'
            ? GoCheckCircle
            : status.state === 'in_progress'
              ? GoSync
              : ['cancelled', 'skipped', 'neutral'].includes(status.state)
                ? GoSkip
                : GoClock;
  return (
    <span
      className={`githubStatus githubTone-${status.tone}`}
      role="img"
      aria-label={status.label}
      title={status.label}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
