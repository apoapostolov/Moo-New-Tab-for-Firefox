import { useTranslationVersion } from 'contexts/TranslationContext';
import { Suspense, lazy } from 'react';

const Analog = lazy(() => import('react-clock'));

function AnalogClock({ time, onDoubleClick }) {
  useTranslationVersion();
  const enabled = (setting) => {
    return localStorage.getItem(setting) === 'true';
  };

  return (
    <Suspense fallback={<></>}>
      <div className="clockBackground" onDoubleClick={onDoubleClick}>
        <Analog
          className="analogclock clock-container"
          value={time}
          size={1.5 * Number(localStorage.getItem('zoomClock') || 100)}
          renderMinuteMarks={enabled('minuteMarks')}
          renderHourMarks={enabled('hourMarks')}
          renderSecondHand={enabled('secondHand')}
          renderMinuteHand={enabled('minuteHand')}
          renderHourHand={enabled('hourHand')}
        />
      </div>
    </Suspense>
  );
}

export { AnalogClock as default, AnalogClock };
