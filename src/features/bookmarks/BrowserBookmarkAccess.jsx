import { useState } from 'react';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import { requestBrowserBookmarkAccess } from './browserBookmarks';

export default function BrowserBookmarkAccess({ access, onGranted }) {
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  return (
    <div className="bookmarkAccess">
      <p role="status">
        {uiText(
          denied && access === 'permission'
            ? 'bookmarks_browser_denied'
            : `bookmarks_browser_${access}`,
        )}
      </p>
      {access === 'permission' && (
        <button
          type="button"
          className="gwButton"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const granted = await requestBrowserBookmarkAccess();
              setDenied(!granted);
              if (granted) {
                onGranted?.();
                EventBus.emit('refresh', 'bookmarks');
              }
            } catch {
              setDenied(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {uiText(busy ? 'widget_loading' : 'bookmarks_browser_allow')}
        </button>
      )}
    </div>
  );
}
