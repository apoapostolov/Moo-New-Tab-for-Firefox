import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdOpenInNew, MdMenuBook, MdOutlineBookmarkBorder } from 'react-icons/md';
import { uiText } from 'lib/translations';
import { IconButton } from '../widgetKit/WidgetKit';
import useSidePreview from '../widgetKit/useSidePreview';
import usePreviewScroll from '../widgetKit/usePreviewScroll';
import Markdown from '../scratch/Markdown';

export default function BookmarkDetails({ item, preview, locale, onOpen, linkTarget = '_self' }) {
  const { panelRef } = preview;
  const body = useRef(null);
  const style = useSidePreview(preview.active.anchor, panelRef, 430);
  usePreviewScroll(body, item.selectionKey);
  return createPortal(
    <div
      className="bookmarkDetailsPanel"
      popover="manual"
      role="dialog"
      aria-label={uiText('bookmarks_preview', { title: item.title })}
      tabIndex={-1}
      ref={panelRef}
      style={style}
      onMouseEnter={preview.enter}
      onMouseLeave={preview.leave}
      onFocus={preview.enter}
      onBlur={preview.leave}
    >
      <header>
        <span>
          {item.sources
            .map((source) =>
              source === 'browser'
                ? uiText('bookmarks_browser')
                : source === 'raindrop'
                  ? 'Raindrop'
                  : 'Readwise',
            )
            .join(' · ')}
        </span>
        <a
          className="gwIconButton wkIcon"
          href={item.url}
          target={linkTarget}
          rel="noopener noreferrer"
          aria-label={uiText('bookmarks_open_original')}
          title={uiText('bookmarks_open_original')}
          onClick={() => onOpen(item)}
        >
          <MdOpenInNew />
        </a>
        {item.readerUrl && (
          <a
            className="gwIconButton wkIcon"
            href={item.readerUrl}
            target={linkTarget}
            rel="noopener noreferrer"
            aria-label={uiText('bookmarks_open_service')}
            title={uiText('bookmarks_open_service')}
            onClick={() => onOpen(item)}
          >
            <MdMenuBook />
          </a>
        )}
        <IconButton label={uiText('close_bbfa77')} onClick={() => preview.close(true)}>
          <MdClose />
        </IconButton>
      </header>
      <div className="bookmarkDetailsScroll" ref={body} tabIndex={0}>
        {item.cover && (
          <img
            className="bookmarkPreviewCover"
            src={item.cover}
            alt=""
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
        <h3>{item.title}</h3>
        <div className="bookmarkDetailMeta">
          {item.author && <span>{item.author}</span>}
          <span>{new URL(item.url).hostname.replace(/^www\./, '')}</span>
          {item.minutes > 0 && <span>{uiText('bookmarks_minutes', { count: item.minutes })}</span>}
        </div>
        {item.progress !== null && item.progress > 0 && (
          <div className="bookmarkReadingProgress">
            <progress
              max="1"
              value={item.progress}
              aria-label={uiText('bookmarks_reading_progress')}
            />
            <span>
              {new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
                item.progress,
              )}
            </span>
          </div>
        )}
        {item.description &&
          (item.type === 'highlight' ? (
            <blockquote>{item.description}</blockquote>
          ) : (
            <p className="bookmarkSummary">{item.description}</p>
          ))}
        {item.note && (
          <section className="bookmarkPersonalNote">
            <h4>{uiText('bookmarks_your_note')}</h4>
            <Markdown text={item.note} linkTarget={linkTarget} />
          </section>
        )}
        {item.collection && (
          <p className="bookmarkCollection">
            <MdOutlineBookmarkBorder aria-hidden="true" />
            {item.collection}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="bookmarkTags" aria-label={uiText('bookmarks_tags')} role="group">
            {item.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
        {item.created > 0 && (
          <time className="bookmarkSaved" dateTime={new Date(item.created).toISOString()}>
            {uiText('bookmarks_saved', {
              date: new Date(item.created).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
            })}
          </time>
        )}
      </div>
    </div>,
    document.body,
  );
}
