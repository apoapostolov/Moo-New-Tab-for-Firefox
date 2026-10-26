import { useCallback, useEffect, useState } from 'react';

import { connect, disconnect, getAuth } from '../auth';

/**
 * Shared connection state for the three widgets and the settings section. Widgets render a
 * connect prompt while `auth` is null, so nothing queries Google before an account is linked.
 */
export const useGoogleAuth = () => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getAuth()
      .then((stored) => {
        if (!cancelled) setAuth(stored);
      })
      .catch((readError) => {
        if (!cancelled) setError(readError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const changed = (changes, area) => {
      if (area === 'local' && changes.googleAuth) setAuth(changes.googleAuth.newValue ?? null);
    };
    const storage = typeof browser !== 'undefined' ? browser.storage?.onChanged : null;
    storage?.addListener(changed);
    return () => {
      cancelled = true;
      storage?.removeListener(changed);
    };
  }, []);

  const connectAccount = useCallback(async () => {
    setError('');

    try {
      const next = await connect();
      setAuth(next);

      return next;
    } catch (connectError) {
      setError(connectError.message);
      throw connectError;
    }
  }, []);

  const disconnectAccount = useCallback(async () => {
    await disconnect();
    setAuth(null);
  }, []);

  return { auth, loading, error, connectAccount, disconnectAccount };
};
