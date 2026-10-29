export const CALENDAR_ALERT_STATE = 'mooCalendarAlerts';
export const calendarAlertsAvailable = () => Boolean(globalThis.browser?.runtime?.sendMessage && globalThis.browser?.permissions?.request);
export const calendarAlertMessage = (message) => globalThis.browser?.runtime?.sendMessage?.(message) || Promise.resolve(null);
export const clearCalendarAlerts = () => calendarAlertMessage({ type:'moo-calendar-alert-clear' });
export const invalidateEventAlerts = (calendarId,id) => calendarAlertMessage({type:'moo-calendar-alert-remove',key:`${calendarId}:${id}`}).catch(()=>{});
export const calendarNotificationAccess = async () => {
  if(!calendarAlertsAvailable())return 'unavailable';
  try{return await browser.permissions.contains({permissions:['notifications']})?'granted':'permission';}catch{return 'permission';}
};
export const requestCalendarNotifications = () => globalThis.browser?.permissions?.request({permissions:['notifications']}) || Promise.resolve(false);
