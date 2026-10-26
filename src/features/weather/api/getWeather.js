import { fetchWithTimeout as fetch, settingsStamp, online } from 'utils/requests';
import variables from 'config/variables';

const convertTemperature = (temp, format) => {
  if (format === 'celsius') {
    return Math.round(temp - 273.15);
  } else if (format === 'fahrenheit') {
    return Math.round((temp - 273.15) * 1.8 + 32);
  }
  return Math.round(temp);
};

const getLocalizedTempSymbol = (format) => {
  const language = localStorage.getItem('language') || 'en_GB';
  const baseLang = language.split('_')[0];

  const localizedSymbols = {
    ar: {
      celsius: '°س', // Arabic: Celsius (سيلزيوس)
      fahrenheit: '°ف', // Arabic: Fahrenheit (فهرنهايت)
      kelvin: 'ك', // Arabic: Kelvin (كلفن)
    },
    fa: {
      celsius: '°س', // Persian: Celsius
      fahrenheit: '°ف', // Persian: Fahrenheit
      kelvin: 'ک', // Persian: Kelvin
    },
  };

  // Fallback for languages that name no symbols here.
  const defaultSymbols = {
    celsius: '°C',
    fahrenheit: '°F',
    kelvin: 'K',
  };

  return localizedSymbols[baseLang]?.[format] || defaultSymbols[format] || 'K';
};

const inFlight = new Map();
export const getWeather = async (location) => {
  const tempFormat = localStorage.getItem('tempformat') || 'celsius';
  const key = JSON.stringify([location, tempFormat, localStorage.getItem('language') || 'en_GB']);
  let cached;
  try {
    cached = JSON.parse(localStorage.getItem('currentWeather'));
  } catch {
    /* Ignore a damaged cache. */
  }
  if (cached?.key === key && Date.now() - cached.cachedAt < 300000) return cached.data;
  if (!location || localStorage.getItem('offlineMode') === 'true') return { done: true };
  if (inFlight.has(key)) return inFlight.get(key);
  const request = fetchWeather(location, tempFormat, key);
  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
};

const fetchWeather = async (location, tempFormat, key) => {
  const stamp = settingsStamp(/^(location|tempformat|language|offlineMode)$/);
  try {
    const response = await fetch(
      variables.constants.API_URL + `/weather?city=${encodeURIComponent(location)}`,
    );

    if (!response.ok) {
      console.error('Weather API response not ok:', response.status, response.statusText);
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 404) {
      return {
        location: variables.getMessage('widgets.weather.not_found'),
        done: true,
      };
    }

    const { temp, temp_min, temp_max, feels_like } = data.main;

    const cacheable = {
      icon: data.weather[0].icon,
      temp_text: getLocalizedTempSymbol(tempFormat),
      weather: {
        temp: convertTemperature(temp, tempFormat),
        description: data.weather[0].description,
        temp_min: convertTemperature(temp_min, tempFormat),
        temp_max: convertTemperature(temp_max, tempFormat),
        feels_like: convertTemperature(feels_like, tempFormat),
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        wind_degrees: data.wind.deg,
        cloudiness: data.clouds.all,
        visibility: data.visibility,
        pressure: data.main.pressure,
      },
      done: true,
    };
    if (!online() || stamp !== settingsStamp(/^(location|tempformat|language|offlineMode)$/))
      return null;
    localStorage.setItem(
      'currentWeather',
      JSON.stringify({ key, data: cacheable, cachedAt: Date.now() }),
    );
    return cacheable;
  } catch (error) {
    console.error('Fetch Error: ', error);
    return {
      location: variables.getMessage('widgets.weather.fetch_error'),
      done: true,
    };
  }
};
