import { useEffect, useState } from 'react';
import { Row, Content, Action } from 'components/Layout/Settings';
import { Switch } from 'components/Form/Settings';
import { OptionInput, OptionToggle } from 'features/widgetKit/WidgetKit';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import {
  calendarAlertsAvailable,
  calendarNotificationAccess,
  clearCalendarAlerts,
  requestCalendarNotifications,
} from '../alertBridge';

export default function CalendarAlertSettings() {
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    calendarNotificationAccess().then((access) => {
      if (
        live &&
        access !== 'granted' &&
        localStorage.getItem('googleCalendarNotifications') === 'true'
      ) {
        localStorage.setItem('googleCalendarNotifications', 'false');
        setRevision((n) => n + 1);
        clearCalendarAlerts().catch(() => {});
      }
    });
    return () => {
      live = false;
    };
  }, []);
  const toggle = async (enabled) => {
    if (!enabled) {
      setMessage('');
      await clearCalendarAlerts().catch(() => {});
      return;
    }
    // Permission must be requested directly from the switch's user gesture.
    const permission = requestCalendarNotifications();
    setBusy(true);
    let granted = false;
    try {
      granted = await permission;
    } catch {
      /* Show the same recovery for denial or failure. */
    }
    localStorage.setItem('googleCalendarNotifications', String(granted));
    setBusy(false);
    setRevision((n) => n + 1);
    setMessage(granted ? '' : uiText('calendar_alert_permission'));
    EventBus.emit('refresh', 'calendar');
  };
  const validMinutes = (v) =>
    v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 10080;
  return (
    <>
      <Row>
        <Content
          title={uiText('calendar_alert_browser')}
          subtitle={
            calendarAlertsAvailable()
              ? uiText('calendar_alert_background_hint')
              : uiText('calendar_alert_extension_only')
          }
        />
        <Action>
          <Switch
            key={revision}
            name="googleCalendarNotifications"
            category="google"
            stateText
            disabled={busy || !calendarAlertsAvailable()}
            onChange={toggle}
          />
        </Action>
      </Row>
      {message && (
        <p className="gwError" role="status">
          {message}
        </p>
      )}
      <OptionToggle
        category="google"
        name="googleCalendarAmberEnabled"
        title={uiText('calendar_alert_amber')}
        hint={uiText('calendar_alert_amber_hint')}
      />
      <OptionInput
        category="google"
        name="googleCalendarAmberMinutes"
        title={uiText('calendar_alert_amber_minutes')}
        type="number"
        min="0"
        max="10080"
        step="1"
        validate={validMinutes}
      />
      <OptionToggle
        category="google"
        name="googleCalendarRedEnabled"
        title={uiText('calendar_alert_red')}
        hint={uiText('calendar_alert_red_hint')}
      />
      <OptionInput
        category="google"
        name="googleCalendarRedMinutes"
        title={uiText('calendar_alert_red_minutes')}
        hint={uiText('calendar_alert_tone_hint')}
        type="number"
        min="0"
        max="10080"
        step="1"
        validate={validMinutes}
      />
    </>
  );
}
