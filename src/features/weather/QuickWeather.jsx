import { useTranslationVersion } from 'contexts/TranslationContext';
import { fetchWithTimeout as fetch, requestOwner, settingsStamp } from 'utils/requests';
import variables from 'config/variables';
import { memo, useState, useEffect, useCallback, useRef, useEffectEvent } from 'react';
import { formatNumber } from 'utils/formatNumber';

import WeatherIcon from './components/WeatherIcon';
import EventBus from 'utils/eventbus';

import { getWeather } from './api/getWeather.js';
import { weatherSettings, WEATHER_ATTRIBUTION } from './api/providers';

import './quickweather.scss';

const QuickWeather = memo(() => {
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
    if (!location && localStorage.getItem('weatherProvider') !== 'sinoptik') {
      autoFindLocation();
    }
    const geo = geoOwner.current;
    return () => geo.cancel();
  }, [location, autoFindLocation]);

  const updateWeather = useCallback(async () => {
    const request = owner.current.start();
    const stamp = settingsStamp(weatherSettings);
    const data = await getWeather(location);
    if (
      !request.current() ||
      stamp !== settingsStamp(weatherSettings)
    )
      return;
    if (data) {
      setWeatherData(data);
      setDone(data.done);
    } else {
      setWeatherData({ done: true });
      setDone(true);
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

  if (done === false) {
    return <span className="quickweather">…</span>;
  }

  if (!weatherData.weather) {
    return <span className="quickweather weatherNotice">{weatherData.location || location}</span>;
  }

  const source = WEATHER_ATTRIBUTION[weatherData.provider];
  return (
    <span className="quickweather">
      <WeatherIcon name={weatherData.icon} />
      {`${formatNumber(weatherData.weather.temp)}${weatherData.temp_text}`}
      <span className="quickweatherLoc">{weatherData.displayLocation || location}</span>
      {source && <a className="quickweatherSource" href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>}
    </span>
  );
});

QuickWeather.displayName = 'QuickWeather';

export { QuickWeather as default, QuickWeather };
