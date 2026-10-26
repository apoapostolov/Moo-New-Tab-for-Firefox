import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { getSurface } from 'utils/widgetSurface';
import { memo } from 'react';

function WeatherSkeleton({ weatherType }) {
  useTranslationVersion();
  return (
    <div className={`weather skeleton ${getSurface('weather')}`}>
      <div className="weatherCore">
        <div className="iconAndTemps">
          <div className="weathericon">
            <div className="mainSkeletonIcon pulse"></div>
            <span className="pulse">20C</span>
          </div>
          {weatherType >= 2 && (
            <span className="minmax">
              <span className="subtitle pulse">{uiText('min_b6c935')}</span>
              <span className="subtitle pulse">{uiText('max_070602')}</span>
            </span>
          )}
        </div>
        {weatherType >= 2 && (
          <div className="extra-info">
            <span className="pulse">{uiText('feels_like_x_038366')}</span>
            <span className="loc pulse">{uiText('location_6469ac')}</span>
          </div>
        )}
      </div>
      {weatherType >= 3 && (
        <div className="weatherForecast">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="weatherForecastDay">
              <div className="wfSkeletonDay pulse"></div>
              <div className="wfSkeletonIcon pulse"></div>
              <div className="wfSkeletonTemp pulse"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(WeatherSkeleton);
