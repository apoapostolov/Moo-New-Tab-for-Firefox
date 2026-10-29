import { createPortal } from 'react-dom';
import { useRef } from 'react';
import {
  GoLinkExternal,
  GoComment,
  GoGitBranch,
  GoPerson,
  GoTag,
  GoGitCommit,
} from 'react-icons/go';
import { MdClose } from 'react-icons/md';
import { uiText } from 'lib/translations';
import { IconButton } from '../widgetKit/WidgetKit';
import useSidePreview from '../widgetKit/useSidePreview';
import usePreviewScroll from '../widgetKit/usePreviewScroll';
import GitHubStatus from './GitHubStatus';
import GitHubBody from './GitHubBody';
import { githubKind, githubStatus } from './githubPresentation';

export default function GitHubDetails({ item, view, locale, preview }) {
  const { panelRef } = preview;
  const body = useRef(null);
  const style = useSidePreview(preview.active.anchor, panelRef, 430);
  usePreviewScroll(body, `${view}:${item.id}`);
  const kind = githubKind(item, view);
  const status = githubStatus(item, view);
  const format = (time) =>
    new Date(time).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  return createPortal(
    <div
      className="githubDetailsPanel"
      popover="manual"
      role="dialog"
      aria-label={uiText('github_preview_named', { name: item.title })}
      ref={panelRef}
      tabIndex={-1}
      style={style}
      onMouseEnter={preview.enter}
      onMouseLeave={preview.leave}
      onFocus={preview.enter}
      onBlur={preview.leave}
    >
      <header>
        <span className="githubPreviewIdentity">
          {item.repository}
          {item.number ? ` #${item.number}` : ''}
        </span>
        <a
          className="gwIconButton wkIcon"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={uiText('github_open')}
          aria-label={uiText('github_open')}
        >
          <GoLinkExternal />
        </a>
        <IconButton label={uiText('close_bbfa77')} onClick={() => preview.close(true)}>
          <MdClose />
        </IconButton>
      </header>
      <div className="githubDetailsScroll" ref={body}>
        <h3>
          <GitHubStatus item={item} view={view} />
          {item.title}
        </h3>
        <div className="githubDetailMeta">
          <span className={`githubStateLabel githubTone-${status.tone}`}>{status.label}</span>
          {item.author && (
            <span>
              <GoPerson aria-hidden="true" />
              {item.author}
            </span>
          )}
          {Number.isFinite(item.comments) && (
            <span title={uiText('github_comments', { count: item.comments })}>
              <GoComment aria-hidden="true" />
              {item.comments}
            </span>
          )}
          {item.branch && (
            <span title={uiText('github_branch_label')}>
              <GoGitBranch aria-hidden="true" />
              {item.branch}
            </span>
          )}
          {item.sha && (
            <a
              href={`https://github.com/${item.repository}/commit/${item.sha}`}
              target="_blank"
              rel="noopener noreferrer"
              title={uiText('github_commit')}
            >
              <GoGitCommit aria-hidden="true" />
              {item.sha.slice(0, 7)}
            </a>
          )}
          {item.event && <span>{item.event}</span>}
        </div>
        {item.assignees?.length > 0 && (
          <p className="githubDetailAssigned">
            <GoPerson aria-hidden="true" />
            {uiText('github_assignees')}: {item.assignees.join(', ')}
          </p>
        )}
        {item.labels?.length > 0 && (
          <div className="githubLabels" aria-label={uiText('github_labels')} role="group">
            {item.labels.map((label, index) => (
              <span key={`${label.name}-${index}`}>
                <GoTag
                  aria-hidden="true"
                  style={label.color ? { color: `#${label.color}` } : undefined}
                />
                {label.name}
              </span>
            ))}
          </div>
        )}
        {(item.created || item.updated) && (
          <dl className="githubDetailDates">
            {item.created && (
              <div>
                <dt>{uiText('github_created')}</dt>
                <dd>
                  <time dateTime={new Date(item.created).toISOString()}>
                    {format(item.created)}
                  </time>
                </dd>
              </div>
            )}
            {item.updated && (
              <div>
                <dt>{uiText('github_updated_label')}</dt>
                <dd>
                  <time dateTime={new Date(item.updated).toISOString()}>
                    {format(item.updated)}
                  </time>
                </dd>
              </div>
            )}
          </dl>
        )}
        {kind === 'action' ? (
          item.commit && <pre className="githubCommitMessage">{item.commit}</pre>
        ) : item.body === null || item.body === undefined ? (
          <p className="githubBodyNotice">{uiText('github_body_refresh')}</p>
        ) : item.body.trim() ? (
          <GitHubBody item={item} />
        ) : (
          <p className="githubBodyNotice">{uiText('github_no_description')}</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
