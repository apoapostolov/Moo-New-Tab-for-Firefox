import { useTranslationVersion } from 'contexts/TranslationContext';
import { fetchWithTimeout as fetch, requestOwner, settingsStamp } from 'utils/requests';
import variables from 'config/variables';
import { memo, useState, useEffect, useCallback, useRef, useEffectEvent } from 'react';
import { formatNumber } from 'utils/formatNumber';

import WeatherIcon from './components/WeatherIcon';
import { getSurface } from 'utils/widgetSurface';
import Forecast from './components/Forecast';
import Expanded from './components/Expanded';
import WeatherSkeleton from './components/WeatherSkeleton';

import EventBus from 'utils/eventbus';

import { getWeather } from './api/getWeather.js';

import './weather.scss';

const WeatherWidget = memo(({ compact = false }) => {
  useTranslationVersion();
  const owner = useRef(requestOwner());
  const geoOwner = useRef(requestOwner());
  const [location, setLocation] = useState(localStorage.getItem('location') || '');
  const [done, setDone] = useState(false);
  const [weatherData, setWeatherData] = useState({});

  const autoFindLocation = useCallback(() => {
    if (!navigator.geolocation || localStorage.getItem('offlineMode') === 'true') return;
    const request = geoOwner.current.start();
    const stamp = settingsStamp(/^(location|offlineMode)$/);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!request.current()) return;
        try {
          const data = await (
            await fetch(
              `${variables.constants.API_URL}/gps?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`,
              { signal: request.signal },
            )
          ).json();
          if (
            request.current() &&
            stamp === settingsStamp(/^(location|offlineMode)$/) &&
            data &&
            data[0] &&
            data[0].name
          ) {
            localStorage.setItem('location', data[0].name);
            setLocation(data[0].name);
          }
        } catch (e) {
          console.error(e);
        }
      },
      (error) => {
        console.error(error);
      },
      { enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    if (!location) {
      autoFindLocation();
    }
    const geo = geoOwner.current;
    return () => geo.cancel();
  }, [location, autoFindLocation]);
  const updateWeather = useCallback(async () => {
    const request = owner.current.start();
    const stamp = settingsStamp(/^(location|tempformat|language|offlineMode)$/);
    const data = await getWeather(location);
    if (
      !request.current() ||
      stamp !== settingsStamp(/^(location|tempformat|language|offlineMode)$/)
    )
      return;
    if (data) {
      setWeatherData(data);
      setDone(data.done);
    } else {
      setWeatherData({ done: true });
      setDone(true);
    }

    const zoomWeather = `${Number((localStorage.getItem('zoomWeather') || 100) / 100)}em`;
    const weatherElement = document.querySelector('.weather');
    if (weatherElement) {
      weatherElement.style.fontSize = zoomWeather;
    }
  }, [location]);

  const refreshWeather = useEffectEvent(updateWeather);
  useEffect(() => {
    const effectOwner = owner.current;
    const handleRefresh = async (data) => {
      if (data === 'weather') {
        setLocation(localStorage.getItem('location') || '');
        await updateWeather();
      }
    };

    EventBus.on('refresh', handleRefresh);
    const first = setTimeout(refreshWeather, 0);
    const timer = setInterval(updateWeather, 300000);

    return () => {
      effectOwner.cancel();
      clearTimeout(first);
      clearInterval(timer);
      EventBus.off('refresh', handleRefresh);
    };
  }, [updateWeather]);

  const weatherType = compact ? 1 : localStorage.getItem('weatherType') || 1;

  if (done === false) {
    return <WeatherSkeleton weatherType={weatherType} />;
  }

  if (!weatherData.weather) {
    return (
      <div className={`weather ${getSurface('weather')}`}>
        <span className="loc">{location}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`weather weatherCompact ${getSurface('weather')}`}>
        <WeatherIcon name={weatherData.icon} />
        <span>{`${formatNumber(weatherData.weather.temp)}${weatherData.temp_text}`}</span>
        <span className="weatherCompactDesc">{weatherData.weather.description}</span>
        <span className="loc">{location}</span>
      </div>
    );
  }

  return (
    <div className={`weather ${getSurface('weather')}`}>
      <div className="weatherCore">
        <div className="iconAndTemps">
          <div className="weathericon">
            <WeatherIcon name={weatherData.icon} />
            <span>{`${formatNumber(weatherData.weather.temp)}${weatherData.temp_text}`}</span>
          </div>
          {weatherType >= 2 && (
            <span className="minmax">
              <span className="subtitle">{`${formatNumber(weatherData.weather.temp_min)}${weatherData.temp_text}`}</span>
              <span className="subtitle">{`${formatNumber(weatherData.weather.temp_max)}${weatherData.temp_text}`}</span>
            </span>
          )}
        </div>
        {weatherType >= 2 && (
          <div className="extra-info">
            <span>
              {variables.getMessage('widgets.weather.feels_like', {
                amount: `${formatNumber(weatherData.weather.feels_like)}${weatherData.temp_text}`,
              })}
            </span>
            <span className="loc">{location}</span>
          </div>
        )}
      </div>
      {weatherType >= 3 && <Forecast location={location} />}
      {Number(weatherType) === 4 && (
        <Expanded state={weatherData} weatherType={weatherType} variables={variables} />
      )}
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export { WeatherWidget as default, WeatherWidget };
