import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState } from 'react';
import { Button } from 'components/Elements';
import { resetProfile } from 'utils/settings/profile';
function ResetModal({ modalClose, scope = 'settings' }) {
  useTranslationVersion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const erase = scope === 'all';
  async function reset() {
    setBusy(true);
    try {
      await resetProfile(erase);
      window.history.replaceState(null, '', window.location.pathname);
      window.location.reload();
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <div className="smallModal">
      <div className="shareHeader">
        <span className="title">
          {erase ? 'Erase all local data?' : 'Restore the default settings?'}
        </span>
        <button
          type="button"
          className="close"
          aria-label={uiText('close_bbfa77')}
          disabled={busy}
          onClick={modalClose}
        >
          ×
        </button>
      </div>
      <p>
        {erase
          ? 'This removes your settings, notes, pictures, links and Google sign-in from this browser. Save a backup first if you want to keep them.'
          : 'This restores the default appearance and widget settings. Your notes, pictures, links, feeds and sign-in will stay.'}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="resetFooter">
        <Button
          type="secondary"
          label={uiText('cancel_77dfd2')}
          disabled={busy}
          onClick={modalClose}
        />
        <Button
          label={busy ? 'Please wait…' : erase ? 'Erase all local data' : 'Restore settings'}
          disabled={busy}
          onClick={reset}
        />
      </div>
    </div>
  );
}
export { ResetModal as default, ResetModal };
