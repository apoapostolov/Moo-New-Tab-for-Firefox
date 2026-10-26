import variables from 'config/variables';
import { memo, useState, useEffect, useCallback } from 'react';
import { formatNumber } from 'utils/formatNumber';

import WeatherIcon from './components/WeatherIcon';
import EventBus from 'utils/eventbus';

import { getWeather } from './api/getWeather.js';

import './quickweather.scss';

const QuickWeather = memo(() => {
  const [location, setLocation] = useState(localStorage.getItem('location') || '');
  const [done, setDone] = useState(false);
  const [weatherData, setWeatherData] = useState({});

  const autoFindLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await (
            await fetch(
              `${variables.constants.API_URL}/gps?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`,
            )
          ).json();
          if (data && data[0] && data[0].name) {
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
  }, [location, autoFindLocation]);

  const updateWeather = useCallback(async () => {
    const data = await getWeather(location);
    if (data) {
      setWeatherData(data);
      setDone(data.done);
    } else {
      setWeatherData({ done: true });
      setDone(true);
    }
  }, [location]);

  useEffect(() => {
    const handleRefresh = async (data) => {
      if (data === 'weather') {
        await updateWeather();
      }
    };

    EventBus.on('refresh', handleRefresh);
    updateWeather();

    return () => {
      EventBus.off('refresh', handleRefresh);
    };
  }, [updateWeather]);

  if (done === false) {
    return <span className="quickweather">…</span>;
  }

  if (!weatherData.weather) {
    return <span className="quickweather">{location}</span>;
  }

  return (
    <span className="quickweather">
      <WeatherIcon name={weatherData.icon} />
      {`${formatNumber(weatherData.weather.temp)}${weatherData.temp_text}`}
      <span className="quickweatherLoc">{location}</span>
    </span>
  );
});

export { QuickWeather as default, QuickWeather };
