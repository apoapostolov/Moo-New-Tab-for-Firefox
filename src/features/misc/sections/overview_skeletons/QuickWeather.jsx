import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo } from 'react';

function QuickWeatherSkeleton() {
  useTranslationVersion();
  return <span className="quickweather">{uiText('weather_now_69ed32')}</span>;
}

export default memo(QuickWeatherSkeleton);
