/**
 * Google OAuth in an extension. Google refuses `*.extensions.allizom.org`, so the redirect cannot
 * be `identity.getRedirectURL()`. Firefox accepts a loopback redirect
 * `http://127.0.0.1/mozoauth2/<subdomain>` (RFC 8252, Firefox 86+) and a Desktop app client
 * accepts any loopback port; Firefox cancels that request before it leaves, so the flow resolves
 * with the code. The client secret of a Desktop app client is not confidential and never leaves
 * the browser.
 */

const AUTH_KEY = 'googleAuth';

export const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/tasks',
];

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

const base64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomVerifier = () => {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);

  return base64url(bytes);
};

const challengeFor = async (verifier) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));

  return base64url(digest);
};

export const getCredentials = () => ({
  clientId: localStorage.getItem('googleClientId') || '',
  clientSecret: localStorage.getItem('googleClientSecret') || '',
});

/**
 * Firefox only accepts a redirect of its own shape, so the loopback form is
 * derived from the add-on id: https://<uuid>.extensions.allizom.org/ becomes
 * http://127.0.0.1/mozoauth2/<uuid>.
 */
export const getRedirectUri = () => {
  const extensionRedirect = browser.identity.getRedirectURL();
  const subdomain = new URL(extensionRedirect).hostname.split('.')[0];

  return `http://127.0.0.1/mozoauth2/${subdomain}`;
};

export const getAuth = async () => {
  const stored = await browser.storage.local.get(AUTH_KEY);

  return stored?.[AUTH_KEY] ?? null;
};

const saveAuth = async (auth) => {
  await browser.storage.local.set({ [AUTH_KEY]: auth });
};

const clearAuth = async () => {
  await browser.storage.local.remove(AUTH_KEY);
};

const readIdToken = (idToken) => {
  try {
    const payload = idToken.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(json);
  } catch {
    return {};
  }
};

const tokenRequest = async (params) => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error_description || data.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
};

/**
 * Runs the interactive consent flow and stores the resulting tokens.
 * Returns the stored auth record so the caller can show which account connected.
 */
export const connect = async () => {
  const { clientId, clientSecret } = getCredentials();

  if (!clientId || !clientSecret) throw new Error('MISSING_CREDENTIALS');

  const redirectUri = getRedirectUri();
  const verifier = randomVerifier();
  const challenge = await challengeFor(verifier);
  const state = randomVerifier();

  const url = new URL(AUTH_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    // Without this Google only returns a refresh token the first time an
    // account consents, which makes reconnecting after a revoked token fail.
    prompt: 'consent',
    include_granted_scopes: 'true',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  }).toString();

  const returned = await browser.identity.launchWebAuthFlow({
    url: url.toString(),
    interactive: true,
  });

  const params = new URL(returned).searchParams;
  const error = params.get('error');

  if (error) throw new Error(params.get('error_description') || error);
  if (params.get('state') !== state) throw new Error('STATE_MISMATCH');

  const code = params.get('code');

  if (!code) throw new Error('NO_CODE');

  const tokens = await tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const profile = tokens.id_token ? readIdToken(tokens.id_token) : {};

  const auth = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    scope: tokens.scope ?? '',
    email: profile.email ?? '',
    name: profile.name ?? '',
    connectedAt: Date.now(),
  };

  await saveAuth(auth);

  return auth;
};

export const refresh = async () => {
  const { clientId, clientSecret } = getCredentials();
  const auth = await getAuth();

  if (!auth?.refreshToken) throw new Error('NOT_CONNECTED');

  const tokens = await tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: auth.refreshToken,
    grant_type: 'refresh_token',
  });

  const next = {
    ...auth,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    // Google may rotate the refresh token; keep the new one when it does.
    refreshToken: tokens.refresh_token ?? auth.refreshToken,
    scope: tokens.scope ?? auth.scope,
  };

  await saveAuth(next);

  return next;
};

/**
 * Returns a usable access token, refreshing a minute before expiry. Every Google
 * call goes through this instead of reading the stored token directly.
 */
export const getAccessToken = async () => {
  const auth = await getAuth();

  if (!auth) throw new Error('NOT_CONNECTED');

  if (auth.expiresAt - 60_000 > Date.now()) return auth.accessToken;

  const refreshed = await refresh();

  return refreshed.accessToken;
};

export const disconnect = async () => {
  const auth = await getAuth();

  if (auth?.refreshToken) {
    // Best effort: revoking is a courtesy to the account, and the local record
    // has to disappear even when the request fails.
    await fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(auth.refreshToken)}`, {
      method: 'POST',
    }).catch(() => {});
  }

  await clearAuth();
};
