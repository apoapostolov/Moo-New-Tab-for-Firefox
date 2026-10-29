import { useEffect, useState } from 'react';
import { Group, Row, Content } from 'components/Layout/Settings';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import { OptionSelect, OptionInput, OptionToggle } from '../widgetKit/WidgetKit';
import { bookmarkSettings } from './bookmarkStore';
import { readBrowserBookmarks, subscribeBrowserBookmarks } from './browserBookmarks';
import BrowserBookmarkAccess from './BrowserBookmarkAccess';

export default function BrowserBookmarkOptions() {
  const [snapshot, setSnapshot] = useState(null);
  const [revision, setRevision] = useState(0);
  const reload = () => setRevision((value) => value + 1);
  const config = bookmarkSettings().sources.browser;
  useEffect(() => subscribeBrowserBookmarks(reload), []);
  useEffect(() => {
    const changed = (category) => {
      if (category === 'bookmarks') reload();
    };
    EventBus.on('refresh', changed);
    return () => EventBus.off('refresh', changed);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    readBrowserBookmarks({}, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSnapshot(result);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setSnapshot({ error: 'browser', collections: [] });
      });
    return () => controller.abort();
  }, [revision]);
  const folders = snapshot?.collections || [];
  return (
    <Group>
      <Row>
        <Content title={uiText('bookmarks_browser')} subtitle={uiText('bookmarks_browser_hint')} />
      </Row>
      <OptionToggle
        category="bookmarks"
        name="bookmarksBrowserEnabled"
        key={`browser-${config.enabled}`}
        title={uiText('bookmarks_use_browser')}
      />
      {snapshot && (
        <Row>
          <Content
            subtitle={
              <BrowserBookmarkAccess access={snapshot.error || 'granted'} onGranted={reload} />
            }
          />
        </Row>
      )}
      {!snapshot?.error && snapshot && (
        <>
          <OptionSelect
            category="bookmarks"
            name="bookmarksBrowserFolder"
            title={uiText('bookmarks_browser_folder')}
            items={[
              { value: '', text: uiText('bookmarks_browser_all_folders') },
              ...folders.map((folder) => ({ value: folder.id, text: folder.title })),
              ...(config.folder && !folders.some((folder) => folder.id === config.folder)
                ? [{ value: config.folder, text: uiText('bookmarks_error_folder') }]
                : []),
            ]}
          />
          <OptionToggle
            category="bookmarks"
            name="bookmarksBrowserNested"
            title={uiText('bookmarks_browser_nested')}
          />
          <OptionInput
            category="bookmarks"
            name="bookmarksBrowserQuery"
            title={uiText('bookmarks_search')}
            hint={uiText('bookmarks_browser_search_hint')}
            maxLength={1000}
          />
        </>
      )}
    </Group>
  );
}
