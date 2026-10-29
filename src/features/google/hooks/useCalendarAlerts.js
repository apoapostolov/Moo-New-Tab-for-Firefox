import { useEffect, useRef, useState } from 'react';
import EventBus from 'utils/eventbus';
import { settingsStamp } from 'utils/requests';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { listCalendars, listEvents, rangeBounds } from '../services/calendar';
import { getCalendarSettings, refreshMs } from '../settings';
import { CALENDAR_ALERT_STATE, calendarAlertMessage, clearCalendarAlerts } from '../alertBridge';
import { scheduledCalendarEvents } from '../calendarAlerts';

export default function useCalendarAlerts(auth) {
  const [fired,setFired]=useState({}),[error,setError]=useState('');
  const {language}=useTranslationVersion();
  const account=auth?`${auth.email}:${auth.connectedAt}`:'';
  const authRef=useRef(account);authRef.current=account;
  useEffect(()=>{
    const changed=(changes,area)=>{if(area==='local'&&changes[CALENDAR_ALERT_STATE]){const state=changes[CALENDAR_ALERT_STATE].newValue;setFired(state?.account===authRef.current?state.fired||{}:{});}};
    const storage=globalThis.browser?.storage;
    storage?.onChanged?.addListener(changed);
    storage?.local?.get(CALENDAR_ALERT_STATE).then(saved=>{const state=saved?.[CALENDAR_ALERT_STATE];setFired(state?.account===authRef.current?state.fired||{}:{});}).catch(()=>{});
    return ()=>storage?.onChanged?.removeListener(changed);
  },[account]);
  useEffect(()=>{
    let controller,disposed=false;
    const load=async()=>{
      controller?.abort();controller=new AbortController();const signal=controller.signal;
      const settings=getCalendarSettings(),stamp=settingsStamp(/^(google|offlineMode|profileRevision)/),updated=Date.now();
      if(!account||!settings.notifications){setError('');await clearCalendarAlerts().catch(()=>{});return;}
      try{
        const calendars=await listCalendars(signal);
        const events=await listEvents({signal,...rangeBounds(30),calendarIds:settings.calendarIds,calendars,maxResults:2500,includeDeclined:false,strict:true});
        if(disposed||signal.aborted||account!==authRef.current||stamp!==settingsStamp(/^(google|offlineMode|profileRevision)/))return;
        await calendarAlertMessage({type:'moo-calendar-alert-sync',account,updated,events:scheduledCalendarEvents(events,{locale:language.replaceAll('_','-'),use24Hour:settings.use24Hour,startsLabel:uiText('starts_fc612a'),allDayLabel:uiText('all_day_114574')})});
        if(!disposed)setError('');
      }catch(e){if(!disposed&&!signal.aborted)setError(uiText('calendar_alert_sync_error'));}
    };
    const refresh=category=>{if(!category||['google','calendar'].includes(category))load();};
    const storage=event=>{if(event.key&&/^(google|offlineMode|profileRevision)/.test(event.key))load();};
    const start=setTimeout(load,0),timer=setInterval(load,refreshMs(getCalendarSettings().refreshMinutes));
    EventBus.on('refresh',refresh);window.addEventListener('storage',storage);
    return ()=>{disposed=true;controller?.abort();clearTimeout(start);clearInterval(timer);EventBus.off('refresh',refresh);window.removeEventListener('storage',storage);};
  },[account,language]);
  return {fired,error};
}
