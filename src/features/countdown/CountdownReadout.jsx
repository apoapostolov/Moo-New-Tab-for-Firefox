import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { checklistLabel as markdownLabel } from 'features/scratch/Markdown';
import CountdownTitle from './CountdownTitle';
import { countdownDelay, countdownProgress, countdownText } from './countdownStore';

export default function CountdownReadout({ value, onTitleChange, onTitleFocus, angle }) {
  const { language } = useTranslationVersion();
  const locale = language.replaceAll('_', '-');
  const [now, setNow] = useState(Date.now);
  const style = value.style || 'value';
  const text = countdownText(value, now, locale);
  const deadline = new Date(value.target).toLocaleString(locale);
  const progress = countdownProgress(value, now);
  const track = useRef(null);
  const label = useRef(null);
  const [overlapStart, setOverlapStart] = useState(0.4);
  useLayoutEffect(() => {
    if (style !== 'progress') return undefined;
    const measure = () => {
      const width = track.current?.clientWidth;
      const labelWidth = label.current?.offsetWidth;
      if (width && labelWidth) setOverlapStart(Math.max(0, (width - labelWidth) / 2 / width));
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (track.current) observer?.observe(track.current);
    if (label.current) observer?.observe(label.current);
    return () => observer?.disconnect();
  }, [style, text]);
  useEffect(() => {
    let timer;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      clearTimeout(timer);
      timer = setTimeout(
        tick,
        countdownDelay({ target: value.target, interval: value.interval }, time),
      );
    };
    tick();
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [value.target, value.interval, value.format]);
  return (
    <div className="countdownReadout">
      <CountdownTitle
        title={value.title}
        onChange={onTitleChange}
        onFocus={onTitleFocus}
        angle={angle}
      />
      {style !== 'progress' && (
        <time className="countdownValue" dateTime={value.target} title={deadline}>
          {text}
        </time>
      )}
      {style !== 'value' && (
        <div className={`countdownProgress${style === 'progress' ? ' countdownProgressOnly' : ''}`}>
          <progress
            ref={track}
            value={progress}
            max="1"
            aria-label={markdownLabel(value.title) || uiText('countdown_label')}
            aria-valuetext={text}
            tabIndex={style === 'progress' ? 0 : undefined}
          />
          {style === 'progress' && (
            <time
              ref={label}
              className={`countdownProgressPill${progress >= overlapStart ? ' isOverFill' : ''}`}
              dateTime={value.target}
              aria-hidden="true"
            >
              {text}
            </time>
          )}
        </div>
      )}
    </div>
  );
}
