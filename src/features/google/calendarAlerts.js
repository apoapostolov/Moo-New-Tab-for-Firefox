const MAX_MINUTES = 40320;
export function validEventReminders(value) {
  return Boolean(value && typeof value.useDefault === 'boolean' && (value.useDefault ||
    (Array.isArray(value.overrides) && value.overrides.length <= 5 && value.overrides.every(item =>
      item && ['popup','email'].includes(item.method) && typeof item.minutes === 'number' && Number.isInteger(item.minutes) && item.minutes >= 0 && item.minutes <= MAX_MINUTES))));
}
export function eventReminders(value) {
  if (!validEventReminders(value)) throw new Error('Choose up to five alerts, from 0 to 40,320 minutes before the event.');
  return value.useDefault ? { useDefault:true } : { useDefault:false,overrides:value.overrides.map(({method,minutes})=>({method,minutes})) };
}
export function reminderForm(value={useDefault:true}) {
  return {...value,overrides:(value.overrides||[]).map((item,index)=>({...item,_id:`existing-${index}`}))};
}

/** Google all-day dates use the calendar's timezone rather than the viewer's midnight. */
export function calendarAlertInstant(value,timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return Date.parse(value);
  if (!timeZone) return new Date(`${value}T00:00:00`).getTime();
  const [year,month,day]=value.split('-').map(Number),target=Date.UTC(year,month-1,day);
  try {
    const format=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    let guess=target;
    for(let n=0;n<4;n++) {const p=Object.fromEntries(format.formatToParts(guess).map(({type,value})=>[type,value]));const offset=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-guess;const next=target-offset;if(next===guess)return guess;guess=next;}
    return guess;
  }catch{return new Date(`${value}T00:00:00`).getTime();}
}
export const alertOccurrence = event => `${event.calendarId}:${event.id}:${event.start}`;
export function calendarAlertTone(event,settings,fired={},now=Date.now()) {
  const start=calendarAlertInstant(event.start,event.timeZone),end=calendarAlertInstant(event.end,event.timeZone);
  if(!Number.isFinite(start)||!Number.isFinite(end)||now>=end||event.status==='cancelled'||event.declined)return '';
  if(fired[alertOccurrence(event)])return 'green';
  const minutes=(start-now)/60000;
  if(minutes<=0)return '';
  if(settings.redEnabled&&minutes<=settings.redMinutes)return 'red';
  if(settings.amberEnabled&&minutes<=settings.amberMinutes)return 'amber';
  return '';
}

export function scheduledCalendarEvents(events,{locale='en-GB',use24Hour=true,startsLabel='Starts',allDayLabel='All day'}={}) {
  return events.filter(e=>e.status!=='cancelled'&&!e.declined).map(e=>({
    key:`${e.calendarId}:${e.id}`,occurrence:alertOccurrence(e),title:e.title,
    start:calendarAlertInstant(e.start,e.timeZone),end:calendarAlertInstant(e.end,e.timeZone),
    minutes:(e.reminders?.useDefault?e.defaultReminders:e.reminders?.overrides)?.filter(r=>r.method==='popup'&&Number.isInteger(r.minutes)&&r.minutes>=0&&r.minutes<=MAX_MINUTES).map(r=>r.minutes)||[],
    message:`${startsLabel} ${new Date(calendarAlertInstant(e.start,e.timeZone)).toLocaleString(locale,{weekday:'short',day:'numeric',month:'short',...(!e.allDay?{hour:'2-digit',minute:'2-digit',hour12:!use24Hour}:{})})}${e.allDay?` · ${allDayLabel}`:''}`,
  })).filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>e.start);
}
