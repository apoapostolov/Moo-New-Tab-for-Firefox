import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo, useState, useEffect, useCallback } from 'react';

import WeatherIcon from './WeatherIcon';

import EventBus from 'utils/eventbus';

const wmoToIcon = (code) => {
  if (code === 0) return '01d';
  if (code === 1) return '02d';
  if (code === 2) return '02d';
  if (code === 3) return '04d';
  if (code === 45 || code === 48) return '50d';
  if (code >= 51 && code <= 57) return '09d';
  if (code >= 61 && code <= 67) return '10d';
  if (code >= 71 && code <= 77) return '13d';
  if (code >= 80 && code <= 82) return '09d';
  if (code >= 85 && code <= 86) return '13d';
  if (code >= 95) return '11d';
  return '03d';
};

const Forecast = memo(({ location }) => {
  useTranslationVersion();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchForecast = useCallback(
    async (signal) => {
      if (localStorage.getItem('offlineMode') === 'true') return;
      setLoading(true);
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
          { signal },
        );
        const geoData = await geoRes.json();
        if (!geoData.results || !geoData.results.length) {
          setLoading(false);
          return;
        }
        const { latitude, longitude } = geoData.results[0];
        const tempUnit =
          localStorage.getItem('tempformat') === 'fahrenheit' ? 'fahrenheit' : 'celsius';
        const fcRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${tempUnit}`,
          { signal },
        );
        const fcData = await fcRes.json();
        const daily = fcData.daily;
        if (!daily) {
          setLoading(false);
          return;
        }
        const result = daily.time.slice(0, 5).map((t, i) => ({
          date: new Date(`${t}T00:00:00`),
          icon: wmoToIcon(daily.weathercode[i]),
          max: Math.round(daily.temperature_2m_max[i]),
          min: Math.round(daily.temperature_2m_min[i]),
        }));
        setDays(result);
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Forecast fetch error', e);
        }
      } finally {
        setLoading(false);
      }
    },
    [location],
  );

  useEffect(() => {
    const controller = new AbortController();
    const handleRefresh = (data) => {
      if (data === 'weather') fetchForecast(controller.signal);
    };
    EventBus.on('refresh', handleRefresh);
    fetchForecast(controller.signal);
    return () => {
      controller.abort();
      EventBus.off('refresh', handleRefresh);
    };
  }, [fetchForecast]);

  if (loading) {
    // Mirrors the finished cell so the row keeps its size while the forecast loads.
    return (
      <div className="weatherForecast" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="weatherForecastDay">
            <div className="wfSkeletonDay pulse" />
            <div className="wfSkeletonIcon pulse" />
            <div className="wfSkeletonTemp pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!days.length) {
    return null;
  }

  const symbol = localStorage.getItem('tempformat') === 'fahrenheit' ? '°F' : '°C';

  return (
    <div className="weatherForecast">
      {days.map((d, i) => (
        <div key={i} className="weatherForecastDay">
          <span className="wfDay">
            {i === 0 ? 'Today' : d.date.toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
          <WeatherIcon name={d.icon} />
          <span className="wfTemps" title={`High ${d.max}${symbol} · Low ${d.min}${symbol}`}>
            {d.max}
            {symbol}
          </span>
        </div>
      ))}
    </div>
  );
});

Forecast.displayName = 'Forecast';

export default Forecast;
