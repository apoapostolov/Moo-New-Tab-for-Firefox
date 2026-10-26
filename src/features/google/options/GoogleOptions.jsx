import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MdOpenInNew } from 'react-icons/md';

import { Row, Content, Action, Group } from 'components/Layout/Settings/Item';
import { Text } from 'components/Form/Settings';
import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';

import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { getRedirectUri, SCOPES } from '../auth';
import { ensureDefaults } from '../settings';
import GoogleWidgetSettings from './WidgetSettings';
import { describeError } from '../components/ConnectPrompt';

import '../google.scss';

const SERVICE_LABELS = {
  'https://www.googleapis.com/auth/gmail.readonly': 'Mail, read only',
  'https://www.googleapis.com/auth/calendar.events': 'Calendar events, read and write',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly':
    'Calendar list, to pick which calendars show',
  'https://www.googleapis.com/auth/tasks': 'Tasks, read and write',
};

const CREDENTIALS_URL = 'https://console.cloud.google.com/apis/credentials';

/**
 * Google needs an app of your own first, so the order mirrors the work: register, paste
 * credentials, connect. Connect stays locked until both credentials are in, or it can only fail.
 */
const Step = ({ number }) => <span className="googleStepNumber">{number}</span>;

const GoogleOptions = () => {
  const { auth, loading, error, connectAccount, disconnectAccount } = useGoogleAuth();
  const [busy, setBusy] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    try {
      setRedirectUri(getRedirectUri());
    } catch {
      setRedirectUri('');
    }

    setClientId(localStorage.getItem('googleClientId') || '');
    setClientSecret(localStorage.getItem('googleClientSecret') || '');
    ensureDefaults();
  }, []);

  const ready = Boolean(clientId.trim() && clientSecret.trim());

  const connectNow = useCallback(async () => {
    setBusy(true);

    try {
      const next = await connectAccount();
      toast(`Google connected${next?.email ? ` as ${next.email}` : ''}`);

      // The widgets only wake up when they are told something changed.
      window.location.reload();
    } catch {
      // Reported through `error` below.
    } finally {
      setBusy(false);
    }
  }, [connectAccount]);

  const disconnectNow = useCallback(async () => {
    setBusy(true);

    try {
      await disconnectAccount();
      toast('Google disconnected');
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }, [disconnectAccount]);

  return (
    <>
      {/* Registering the app is one procedure in three steps, so the steps are
          one block: the redirect URI and the scopes belong to step 1, and the
          Connect button only makes sense after step 2. */}
      <Group>
        <Row>
          <Content
            title={
              <>
                <Step number="1" />
                Register Moo in Google Cloud
              </>
            }
            subtitle="Google only answers apps it knows about, and Moo isn't one yet. In your own Cloud project, enable the Gmail, Calendar and Tasks APIs, then create an OAuth client of type Desktop app."
          />
          <Action>
            <a
              className="gwButton googleOpenLink"
              href={CREDENTIALS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google Cloud <MdOpenInNew />
            </a>
          </Action>
        </Row>

        <Row>
          <Content
            title="Paste this Redirect URI when Google asks"
            subtitle="Copy it exactly as it is. It belongs to this installation and Google rejects anything else."
          />
          <Action>
            <code className="googleRedirect">
              {redirectUri || 'only visible inside the extension'}
            </code>
          </Action>
        </Row>

        <Row>
          <Content
            title="Scopes Moo will ask for"
            subtitle="The permissions the app requests. Nothing is read until you connect."
          />
          <Action>
            <ul className="googleScopeList">
              {SCOPES.filter((scope) => SERVICE_LABELS[scope]).map((scope) => (
                <li key={scope}>{SERVICE_LABELS[scope]}</li>
              ))}
            </ul>
          </Action>
        </Row>

        <Row>
          <Content
            title={
              <>
                <Step number="2" />
                Paste the client ID and secret
              </>
            }
            subtitle="Both come from the client you made in step 1. They stay in this browser profile."
          />
          <Action>
            <Text
              name="googleClientId"
              title="Client ID"
              placeholder="…apps.googleusercontent.com"
              onChange={setClientId}
            />
            <Text
              name="googleClientSecret"
              title="Client secret"
              placeholder="GOCSPX-…"
              onChange={setClientSecret}
            />
          </Action>
        </Row>

        <Row>
          <Content
            title={
              <>
                <Step number="3" />
                Connect
              </>
            }
            subtitle={
              loading
                ? 'Checking…'
                : auth
                  ? `Connected${auth.email ? ` as ${auth.email}` : ''}. Disconnect only forgets the tokens here; your Google account stays as it is.`
                  : ready
                    ? 'Google opens its own window and you approve the permissions there.'
                    : 'Locked until step 2 is done. Without the client ID and secret Google has no app to talk to.'
            }
          />
          <Action>
            <button
              type="button"
              className="gwButton"
              onClick={auth ? disconnectNow : connectNow}
              disabled={busy || loading || (!auth && !ready)}
            >
              {auth ? 'Disconnect' : busy ? 'Waiting for Google…' : 'Connect Google'}
            </button>
          </Action>
        </Row>
      </Group>

      {error && (
        <Row>
          <Content title="Last error" subtitle={describeError(error)} />
        </Row>
      )}

      {auth && <GoogleWidgetSettings />}

      {/* One switch per card: the three can sit over very different wallpapers,
          so the panel style is stored per widget like the other sections. */}
      {auth && (
        <Group>
          <WidgetSurface setting="surfaceMail" category="google" title="Mail panel" />
          <WidgetSurface setting="surfaceCalendar" category="google" title="Calendar panel" />
          <WidgetSurface setting="surfaceTasks" category="google" title="Tasks panel" />
        </Group>
      )}
    </>
  );
};

export default GoogleOptions;
