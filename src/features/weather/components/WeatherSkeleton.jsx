import { getSurface } from 'utils/widgetSurface';
import { memo } from 'react';

function WeatherSkeleton({ weatherType }) {
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
              <span className="subtitle pulse">min</span>
              <span className="subtitle pulse">max</span>
            </span>
          )}
        </div>
        {weatherType >= 2 && (
          <div className="extra-info">
            <span className="pulse">feels like x</span>
            <span className="loc pulse">location</span>
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
