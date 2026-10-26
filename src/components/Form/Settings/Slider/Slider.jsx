import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { memo, useState, useCallback, useRef, useEffect, useContext } from 'react';
import { RowLabelContext } from 'components/Layout/Settings/Item/SettingsItem';
import { toast } from 'react-toastify';
import { MdRefresh } from 'react-icons/md';

import EventBus from 'utils/eventbus';

import './Slider.scss';

const SliderComponent = memo((props) => {
  useTranslationVersion();
  const rowLabel = useContext(RowLabelContext);
  const [value, setValue] = useState(localStorage.getItem(props.name) || props.default);
  const animationRef = useRef(null);
  useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

  const handleChange = useCallback(
    (e) => {
      let newValue = e.target.value;
      newValue = Number(newValue);

      if (newValue > props.max) {
        newValue = props.max;
      }

      if (newValue < props.min) {
        newValue = props.min;
      }

      localStorage.setItem(props.name, newValue);
      setValue(newValue);

      if (props.element) {
        if (!document.querySelector(props.element)) {
          document.querySelector('.reminder-info').style.display = 'flex';
          return localStorage.setItem('showReminder', true);
        }
      }

      EventBus.emit('refresh', props.category);
    },
    [props],
  );

  const resetItem = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = Number(value);
    const endValue = Number(props.default || 0);
    const duration = 300; // milliseconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOutCubic;
      const roundedValue =
        Math.round(currentValue / (Number(props.step) || 1)) * (Number(props.step) || 1);

      localStorage.setItem(props.name, roundedValue);
      setValue(roundedValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        localStorage.setItem(props.name, endValue);
        setValue(endValue);
        EventBus.emit('refresh', props.category);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    toast(variables.getMessage('toasts.reset'));
  }, [value, props]);

  const percentage =
    ((Number(value) - Number(props.min)) / (Number(props.max) - Number(props.min))) * 100;

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-value">{Number(value)}</span>
        <button type="button" className="slider-reset" onClick={resetItem}>
          <MdRefresh />
          {variables.getMessage('modals.main.settings.buttons.reset')}
        </button>
      </div>
      <div className="slider-wrapper">
        <input
          type="range"
          className="slider-input"
          value={Number(value)}
          onChange={handleChange}
          min={Number(props.min)}
          max={Number(props.max)}
          step={Number(props.step) || 1}
          style={{ '--slider-percentage': `${percentage}%` }}
          aria-label={props.title || props.name}
          aria-labelledby={!props.title && rowLabel ? rowLabel : undefined}
          aria-valuemin={Number(props.min)}
          aria-valuemax={Number(props.max)}
          aria-valuenow={Number(value)}
          disabled={props.disabled || false}
        />
        {props.marks && props.marks.length > 0 && (
          <div className="slider-marks">
            {props.marks.map((mark) => (
              <span
                key={mark.value}
                className="slider-mark"
                style={{
                  left: `${((mark.value - Number(props.min)) / (Number(props.max) - Number(props.min))) * 100}%`,
                }}
              >
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SliderComponent.displayName = 'SliderComponent';

export { SliderComponent as default, SliderComponent as Slider };
