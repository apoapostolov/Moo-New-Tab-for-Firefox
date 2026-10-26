import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState, useEffect, useRef, useEffectEvent } from 'react';

import { convertTimezone } from 'utils/date';
import {
  offClockType,
  progressPosition,
  readPercentageDoubleClick,
  resolveTimeType,
} from 'utils/clockDays';
import { formatPercentage, formatDigits } from 'utils/formatNumber';
import { AnalogClock } from './components/AnalogClock';
import { VerticalClock } from './components/VerticalClock';
import EventBus from 'utils/eventbus';

import './clock.scss';

const formatPaddedDigits = (value) => {
  const str = String(value);
  // Per digit, so locale numerals keep their padding.
  return str
    .split('')
    .map((digit) => formatDigits(digit))
    .join('');
};

const Clock = () => {
  useTranslationVersion();
  // Handing the clock to its fallback by hand lasts until the gesture is repeated, and
  // only while Progress is the clock being replaced.
  const peekRef = useRef(false);
  const timerRef = useRef(undefined);

  // The clock can be pinned to a zone, so the day and the shift are read from the same
  // clock the time is drawn with.
  const nowInZone = () => {
    const now = new Date();
    const timezone = localStorage.getItem('timezone');

    return timezone && timezone !== 'auto' ? convertTimezone(now, timezone) : now;
  };

  // The type to draw, with a hand-picked fallback applied over the automatic one.
  const typeFor = (now) => {
    const natural = resolveTimeType(now);

    return peekRef.current && natural === 'percentageComplete' ? offClockType() : natural;
  };

  const intervalFor = (kind) =>
    localStorage.getItem('seconds') === 'true' || kind === 'analogue'
      ? 1000 - (Date.now() % 1000)
      : 60000 - (Date.now() % 60000);

  const [time, setTime] = useState('');
  const [finalHour, setFinalHour] = useState('');
  const [finalMinute, setFinalMinute] = useState('');
  const [finalSeconds, setFinalSeconds] = useState('');
  const [ampm, setAmpm] = useState('');
  const [display, setDisplay] = useState('block');
  const [fontSize, setFontSize] = useState(
    () => `${(4 * Number(localStorage.getItem('zoomClock') || 100)) / 100}em`,
  );
  // Progress through the day (or shift) as a fraction, 0–1; only the percentage clock reads it.
  const [fraction, setFraction] = useState(0);
  // Progress steps aside on days it is not set for and outside its shift window.
  const [type, setType] = useState(() => typeFor(nowInZone()));

  /**
   * Everything a clock type shows, written in one go. The type and the text it draws are
   * always set together: the analogue clock holds a Date while the others hold a string,
   * so a render sitting between the two would put a Date inside a span.
   */
  const applyNow = (now, kind) => {
    switch (kind) {
      case 'percentageComplete': {
        // Of the shift when one is set, otherwise of the full 24 hours. The window
        // decides the type, so a position is always there to read.
        const position = progressPosition(now);
        const elapsed = position ? position.fraction : 0;

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
        let text,
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
            text = `${formatPaddedDigits(hours)}:${formatPaddedDigits(minutes)}${sec}`;
            setFinalHour(formatPaddedDigits(hours));
            setFinalMinute(formatPaddedDigits(minutes));
          } else {
            const hours = now.getHours();
            text = `${formatDigits(hours)}:${formatPaddedDigits(minutes)}${sec}`;
            setFinalHour(formatDigits(hours));
            setFinalMinute(formatPaddedDigits(minutes));
          }

          setTime(text);
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
            text = `${formatPaddedDigits(paddedHours)}:${formatPaddedDigits(minutes)}${sec}`;
            setFinalHour(formatPaddedDigits(paddedHours));
            setFinalMinute(formatPaddedDigits(minutes));
          } else {
            text = `${formatDigits(hours)}:${formatPaddedDigits(minutes)}${sec}`;
            setFinalHour(formatDigits(hours));
            setFinalMinute(formatPaddedDigits(minutes));
          }

          setTime(text);
          setAmpm(now.getHours() > 11 ? 'PM' : 'AM');
        }
        break;
      }
    }
  };

  const startTime = (wait = intervalFor(type)) => {
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const now = nowInZone();
      const current = typeFor(now);

      // A hand-picked fallback ends with Progress itself: the next window starts on Progress.
      if (peekRef.current && resolveTimeType(now) !== 'percentageComplete') peekRef.current = false;

      setType(current);
      applyNow(now, current);
      startTime(intervalFor(current));
    }, wait);
  };

  /**
   * Double-clicking the clock shows the fallback clock, and double-clicking that brings
   * Progress back. Outside Progress's days and shift the fallback is already the clock,
   * so there is nothing to hand it to and the gesture does nothing.
   */
  const toggleFallback = () => {
    if (!readPercentageDoubleClick()) return;

    const now = nowInZone();

    if (!peekRef.current && resolveTimeType(now) !== 'percentageComplete') return;

    peekRef.current = !peekRef.current;

    const next = typeFor(now);

    setType(next);
    applyNow(now, next);
    startTime(intervalFor(next));
  };

  const startCurrentTime = useEffectEvent((wait) => startTime(wait));
  useEffect(() => {
    const handleRefresh = (data) => {
      if (data === 'clock' || data === 'timezone') {
        if (localStorage.getItem('time') === 'false') {
          setDisplay('none');
          return;
        }

        startCurrentTime(0);

        setDisplay('block');
        setFontSize(`${4 * Number((localStorage.getItem('zoomClock') || 100) / 100)}em`);
      }
    };

    startCurrentTime(0);

    EventBus.on('refresh', handleRefresh);
    return () => {
      EventBus.off('refresh', handleRefresh);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (type === 'analogue') {
    return <AnalogClock time={time} onDoubleClick={toggleFallback} />;
  }

  if (type === 'verticalClock') {
    return (
      <VerticalClock
        finalHour={finalHour}
        finalMinute={finalMinute}
        finalSeconds={finalSeconds}
        onDoubleClick={toggleFallback}
      />
    );
  }

  if (type === 'percentageComplete') {
    return (
      <span
        className="clock clock-container clockProgress"
        // This is what hides a switched-off clock, so it carries the bar's layout, not block.
        style={{ display: display === 'none' ? 'none' : 'inline-flex', fontSize }}
        onDoubleClick={toggleFallback}
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
    <span
      className="clock clock-container"
      style={{ display, fontSize }}
      onDoubleClick={toggleFallback}
    >
      {time}
      <span className="ampm">{ampm}</span>
    </span>
  );
};

export { Clock as default, Clock };
