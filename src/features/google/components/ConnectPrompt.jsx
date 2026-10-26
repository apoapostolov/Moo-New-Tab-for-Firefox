import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState } from 'react';

/**
 * Every widget starts here when no account is linked; connecting is the same flow the settings
 * section offers.
 */

const ConnectPrompt = ({ label, onConnect, error }) => {
  useTranslationVersion();
  const [busy, setBusy] = useState(false);

  const connectNow = async () => {
    setBusy(true);

    try {
      await onConnect();
    } catch {
      // The hook surfaces the error.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="googleWidget googleWidgetEmpty" role="region" aria-label={label}>
      <span className="gwLabel">{label}</span>
      <button type="button" className="gwButton primary" onClick={connectNow} disabled={busy}>
        {busy ? 'Waiting for Google…' : 'Connect Google'}
      </button>
      {error && <p className="gwError">{describeError(error)}</p>}
    </div>
  );
};

export const describeError = (error) => {
  switch (error) {
    case 'MISSING_CREDENTIALS':
      return 'Add a Google client ID and secret in Settings first.';
    case 'NOT_CONNECTED':
      return 'Google is not connected yet.';
    case 'NO_CODE':
      return 'Google did not return an authorisation code.';
    case 'STATE_MISMATCH':
      return 'The sign-in response did not match the request. Try again.';
    default:
      return error;
  }
};

export default ConnectPrompt;
