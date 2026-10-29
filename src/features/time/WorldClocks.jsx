import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { useEffect, useState } from 'react';
import EventBus from 'utils/eventbus';
import { readPercentageDoubleClick } from 'utils/clockDays';
import { readWorldClocks, worldClockTime } from './worldClockStore';

export default function WorldClocks({ children }) {
  useTranslationVersion();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const tick = () => {
      clearTimeout(timer);
      setNow(new Date());
      if (readWorldClocks().length) {
        const interval = localStorage.getItem('seconds') === 'true' ? 1000 : 60000;
        timer = setTimeout(tick, interval - (Date.now() % interval));
      }
    };
    const refresh = (category) => {
      if (category === 'clock' || category === 'timezone') tick();
    };
    tick();
    EventBus.on('refresh', refresh);
    window.addEventListener('storage', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(timer);
      EventBus.off('refresh', refresh);
      window.removeEventListener('storage', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  const clocks = readWorldClocks();
  const protectedClock =
    localStorage.getItem('timeType') === 'percentageComplete' && readPercentageDoubleClick();
  return (
    <div
      className={`timeClocks ${localStorage.getItem('worldClockLayout') === 'inline' ? 'timeClocksInline' : ''}`}
    >
      <div className="primaryClock" data-double-click-protected={protectedClock}>
        {children}
      </div>
      {clocks.length > 0 && (
        <div className="worldClocks" aria-label={uiText('world_clocks')}>
          {clocks.map((clock) => (
            <div className="worldClock" key={clock.id || clock.zone} title={clock.zone}>
              <span className="worldClockLabel">
                {clock.label || clock.zone.split('/').pop().replaceAll('_', ' ')}
              </span>
              <time dateTime={now.toISOString()}>{worldClockTime(now, clock.zone)}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
