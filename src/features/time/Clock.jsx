import { useState, useEffect, useRef } from 'react';

import { convertTimezone } from 'utils/date';
import { shiftFraction } from 'utils/timeShift';
import { resolveTimeType } from 'utils/clockDays';
import { formatPercentage, formatDigits } from 'utils/formatNumber';
import { AnalogClock } from './components/AnalogClock';
import { VerticalClock } from './components/VerticalClock';
import EventBus from 'utils/eventbus';

import './clock.scss';

const formatPaddedDigits = (value) => {
  const str = String(value);
  // Per digit, so locale numerals keep their padding.
  return str.split('').map(digit => formatDigits(digit)).join('');
};

const Clock = () => {
  const [time, setTime] = useState('');
  const [finalHour, setFinalHour] = useState('');
  const [finalMinute, setFinalMinute] = useState('');
  const [finalSeconds, setFinalSeconds] = useState('');
  const [ampm, setAmpm] = useState('');
  const [display, setDisplay] = useState('block');
  const [fontSize, setFontSize] = useState('4em');
  // Progress through the day (or shift) as a fraction, 0–1; only the percentage clock reads it.
  const [fraction, setFraction] = useState(0);
  const timerRef = useRef(undefined);

  // The Progress clock only applies on its chosen days; the rest keep their own type.
  const type = resolveTimeType();

  const startTime = (
    time = localStorage.getItem('seconds') === 'true' || type === 'analogue'
      ? 1000 - (Date.now() % 1000)
      : 60000 - (Date.now() % 60000),
  ) => {
    timerRef.current = setTimeout(() => {
      let now = new Date();
      const timezone = localStorage.getItem('timezone');
      if (timezone && timezone !== 'auto') {
        now = convertTimezone(now, timezone);
      }

      switch (resolveTimeType()) {
        case 'percentageComplete': {
          // Of the shift when one is set, otherwise of the full 24 hours.
          const elapsed = shiftFraction(
            now,
            localStorage.getItem('percentageStart'),
            localStorage.getItem('percentageEnd'),
          );

          setFraction(elapsed);
          setTime(formatPercentage(elapsed));
          setAmpm('');
          break;
        }
        case 'analogue':
          // Loaded on demand: only the analogue clock needs it.
          import('react-clock/dist/Clock.css');

          setTime(now);
          break;
        default: {
          let time,
            sec = '';
          const zero = localStorage.getItem('zero');

          if (localStorage.getItem('seconds') === 'true') {
            const secs = ('00' + now.getSeconds()).slice(-2);
            sec = `:${formatPaddedDigits(secs)}`;
            setFinalSeconds(formatPaddedDigits(secs));
          }

          if (localStorage.getItem('timeformat') === 'twentyfourhour') {
            const minutes = ('00' + now.getMinutes()).slice(-2);
            if (zero === 'true') {
              const hours = ('00' + now.getHours()).slice(-2);
              time = `${formatPaddedDigits(hours)}:${formatPaddedDigits(minutes)}${sec}`;
              setFinalHour(formatPaddedDigits(hours));
              setFinalMinute(formatPaddedDigits(minutes));
            } else {
              const hours = now.getHours();
              time = `${formatDigits(hours)}:${formatPaddedDigits(minutes)}${sec}`;
              setFinalHour(formatDigits(hours));
              setFinalMinute(formatPaddedDigits(minutes));
            }

            setTime(time);
            setAmpm('');
          } else {
            let hours = now.getHours();

            if (hours > 12) {
              hours -= 12;
            } else if (hours === 0) {
              hours = 12;
            }

            const minutes = ('00' + now.getMinutes()).slice(-2);
            if (zero === 'true') {
              const paddedHours = ('00' + hours).slice(-2);
              time = `${formatPaddedDigits(paddedHours)}:${formatPaddedDigits(minutes)}${sec}`;
              setFinalHour(formatPaddedDigits(paddedHours));
              setFinalMinute(formatPaddedDigits(minutes));
            } else {
              time = `${formatDigits(hours)}:${formatPaddedDigits(minutes)}${sec}`;
              setFinalHour(formatDigits(hours));
              setFinalMinute(formatPaddedDigits(minutes));
            }

            setTime(time);
            setAmpm(now.getHours() > 11 ? 'PM' : 'AM');
          }
          break;
        }
      }

      startTime();
    }, time);
  };

  useEffect(() => {
    const handleRefresh = (data) => {
      if (data === 'clock' || data === 'timezone') {
        if (localStorage.getItem('time') === 'false') {
          setDisplay('none');
          return;
        }

        timerRef.current = null;
        startTime(0);

        setDisplay('block');
        setFontSize(`${4 * Number((localStorage.getItem('zoomClock') || 100) / 100)}em`);
      }
    };

    if (resolveTimeType() !== 'analogue') {
      setFontSize(`${4 * Number((localStorage.getItem('zoomClock') || 100) / 100)}em`);
    }

    startTime(0);

    EventBus.on('refresh', handleRefresh);
    return () => {
      EventBus.off('refresh');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (type === 'analogue') {
    return <AnalogClock time={time} />;
  }

  if (type === 'verticalClock') {
    return (
      <VerticalClock finalHour={finalHour} finalMinute={finalMinute} finalSeconds={finalSeconds} />
    );
  }

  if (type === 'percentageComplete') {
    return (
      <span
        className="clock clock-container clockProgress"
        // This is what hides a switched-off clock, so it carries the bar's layout, not block.
        style={{ display: display === 'none' ? 'none' : 'inline-flex', fontSize }}
      >
        <span className="clockProgressValue">{time}</span>
        {/* The number already says the percentage, so the bar is decoration. */}
        <span className="clockProgressTrack" aria-hidden="true">
          <span
            className="clockProgressFill"
            style={{ width: `${Math.round(fraction * 1000) / 10}%` }}
          />
        </span>
      </span>
    );
  }

  return (
    <span className="clock clock-container" style={{ display, fontSize }}>
      {time}
      <span className="ampm">{ampm}</span>
    </span>
  );
};

export { Clock as default, Clock };
