import { GoComment, GoSidebarExpand } from 'react-icons/go';
import { uiText } from 'lib/translations';
import GitHubStatus from './GitHubStatus';

export default function GitHubRow({ item, view, locale, preview, showUpdated }) {
  return (
    <li
      className="githubRow"
      onMouseEnter={(event) => preview.open(item, event.currentTarget.querySelector('a'))}
      onMouseLeave={preview.leave}
    >
      <a
        className="githubItem"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onFocus={(event) => preview.open(item, event.currentTarget)}
        onBlur={preview.leave}
      >
        <GitHubStatus item={item} view={view} />
        <span className="githubItemText">
          <span className="githubItemTitle">{item.title}</span>
          <span className="githubItemContext">
            <span>
              {item.repository}
              {item.number ? ` #${item.number}` : ''}
            </span>
            {showUpdated && item.updated && (
              <time
                dateTime={new Date(item.updated).toISOString()}
                title={new Date(item.updated).toLocaleString(locale)}
              >
                {new Date(item.updated).toLocaleDateString(locale, {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
            {item.comments > 0 && (
              <span
                className="githubCommentCount"
                title={uiText('github_comments', { count: item.comments })}
              >
                <GoComment aria-hidden="true" />
                {item.comments}
              </span>
            )}
          </span>
        </span>
      </a>
      <button
        type="button"
        className="gwIconButton wkIcon githubPreviewTrigger"
        aria-label={uiText('github_preview_named', { name: item.title })}
        title={uiText('github_preview')}
        aria-haspopup="dialog"
        aria-expanded={Boolean(
          preview.active?.id === item.id &&
          preview.active?.repository === item.repository &&
          preview.active?.pinned,
        )}
        onFocus={(event) => preview.open(item, event.currentTarget)}
        onBlur={preview.leave}
        onClick={(event) => preview.open(item, event.currentTarget, true)}
      >
        <GoSidebarExpand aria-hidden="true" />
      </button>
    </li>
  );
}
