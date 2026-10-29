import { fetchWithTimeout as fetch } from 'utils/requests';
import { uiText } from 'lib/translations';

export const WEATHER_PROVIDERS = [
  { value: 'mue', text: 'OpenWeather' },
  { value: 'openmeteo', text: 'Open-Meteo' },
  { value: 'openweather', text: 'OpenWeather' },
  { value: 'weatherapi', text: 'WeatherAPI.com' },
  { value: 'visualcrossing', text: 'Visual Crossing' },
  { value: 'sinoptik', text: 'Sinoptik.bg' },
];

export const WEATHER_ATTRIBUTION = {
  openmeteo: { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
  openweather: { name: 'OpenWeather', url: 'https://openweathermap.org/' },
  weatherapi: { name: 'WeatherAPI.com', url: 'https://www.weatherapi.com/' },
  visualcrossing: { name: 'Visual Crossing', url: 'https://www.visualcrossing.com/' },
  sinoptik: { name: 'Sinoptik.bg', url: 'https://www.sinoptik.bg/' },
};

export const WEATHER_MODELS = [
  { value: 'best_match', text: 'Best match' },
  { value: 'ecmwf_ifs025', text: 'ECMWF IFS' },
  { value: 'ecmwf_aifs025_single', text: 'ECMWF AIFS' },
  { value: 'cma_grapes_global', text: 'CMA GRAPES' },
  { value: 'gfs_seamless', text: 'NOAA GFS' },
  { value: 'icon_seamless', text: 'DWD ICON' },
  { value: 'icon_eu', text: 'DWD ICON Europe' },
  { value: 'meteofrance_seamless', text: 'Météo-France' },
  { value: 'gem_seamless', text: 'ECCC GEM' },
  { value: 'jma_seamless', text: 'JMA' },
  { value: 'ukmo_seamless', text: 'UK Met Office' },
  { value: 'knmi_seamless', text: 'KNMI' },
  { value: 'dmi_seamless', text: 'DMI' },
  { value: 'metno_seamless', text: 'MET Norway' },
];

export const weatherSettings = /^(location|tempformat|language|offlineMode|weatherProvider|weatherModel|weatherOpenWeatherApiKey|weatherWeatherApiKey|weatherVisualCrossingApiKey|weatherSinoptikUrl)$/;

export const WEATHER_KEY_NAMES = { openweather: 'weatherOpenWeatherApiKey', weatherapi: 'weatherWeatherApiKey', visualcrossing: 'weatherVisualCrossingApiKey' };

const request = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return response.json();
};

export const wmoIcon = (code, day = true) => {
  const suffix = day ? 'd' : 'n';
  if (code === 0) return `01${suffix}`;
  if (code <= 2) return `02${suffix}`;
  if (code === 3) return `04${suffix}`;
  if (code === 45 || code === 48) return `50${suffix}`;
  if (code >= 51 && code <= 67) return `10${suffix}`;
  if (code >= 71 && code <= 77) return `13${suffix}`;
  if (code >= 80 && code <= 82) return `09${suffix}`;
  if (code >= 85 && code <= 86) return `13${suffix}`;
  if (code >= 95) return `11${suffix}`;
  return `03${suffix}`;
};

const conditions = (code) => {
  if (code === 0) return uiText('weather_clear');
  if (code <= 2) return uiText('weather_partly_cloudy');
  if (code === 3) return uiText('weather_cloudy');
  if (code === 45 || code === 48) return uiText('weather_fog');
  if (code >= 51 && code <= 67) return uiText('weather_rain');
  if (code >= 71 && code <= 77) return uiText('weather_snow');
  if (code >= 80 && code <= 82) return uiText('weather_showers');
  if (code >= 85 && code <= 86) return uiText('weather_snow_showers');
  if (code >= 95) return uiText('weather_thunderstorm');
  return '';
};

const temperature = (celsius, format) => celsius == null ? null : Math.round(format === 'fahrenheit' ? celsius * 1.8 + 32 : format === 'kelvin' ? celsius + 273.15 : celsius);

export async function getOpenMeteo(location, format, model) {
  const geo = await request(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
  if (!geo.results?.length) throw new Error('Location not found');
  const { latitude, longitude } = geo.results[0];
  const selected = WEATHER_MODELS.some((item) => item.value === model) ? model : 'best_match';
  const params = new URLSearchParams({ latitude, longitude, models: selected, timezone: 'auto', forecast_days: '5', wind_speed_unit: 'ms', current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min' });
  const data = await request(`https://api.open-meteo.com/v1/forecast?${params}`);
  const now = data.current;
  const daily = data.daily;
  if (!now || !daily || now.temperature_2m == null || daily.temperature_2m_min?.[0] == null || daily.temperature_2m_max?.[0] == null) throw new Error('No weather available for this location');
  return {
    icon: wmoIcon(now.weather_code, now.is_day === 1),
    weather: { temp: temperature(now.temperature_2m, format), temp_min: temperature(daily.temperature_2m_min[0], format), temp_max: temperature(daily.temperature_2m_max[0], format), feels_like: temperature(now.apparent_temperature ?? now.temperature_2m, format), description: conditions(now.weather_code), humidity: now.relative_humidity_2m, cloudiness: now.cloud_cover, pressure: now.surface_pressure, wind_speed: now.wind_speed_10m, wind_degrees: now.wind_direction_10m },
    forecast: daily.time.map((date, i) => ({ date, icon: wmoIcon(daily.weather_code[i]), max: temperature(daily.temperature_2m_max[i], format), min: temperature(daily.temperature_2m_min[i], format) })).filter((day) => day.max != null && day.min != null),
  };
}

const weatherApiIcon = (code, day = true) => {
  const suffix = day ? 'd' : 'n';
  if (code === 1000) return `01${suffix}`;
  if (code === 1003) return `02${suffix}`;
  if ([1006, 1009].includes(code)) return `04${suffix}`;
  if ([1030, 1135, 1147].includes(code)) return `50${suffix}`;
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return `11${suffix}`;
  if ([1066, 1069, 1072, 1114, 1117, 1149, 1150, 1168, 1171, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) return `13${suffix}`;
  return `10${suffix}`;
};

const visualIcon = (icon = '') => {
  const night = icon.endsWith('-night');
  const suffix = night ? 'n' : 'd';
  if (icon.startsWith('clear')) return `01${suffix}`;
  if (icon.startsWith('partly-cloudy')) return `02${suffix}`;
  if (icon === 'cloudy') return `04${suffix}`;
  if (icon === 'fog') return `50${suffix}`;
  if (icon.includes('snow') || icon.includes('sleet')) return `13${suffix}`;
  if (icon.includes('thunder')) return `11${suffix}`;
  if (icon.includes('rain')) return `10${suffix}`;
  return `03${suffix}`;
};

export async function getVisualCrossing(location, format, key) {
  if (!key) throw new Error('Visual Crossing API key is missing');
  const params = new URLSearchParams({ key, unitGroup: 'metric', include: 'days,current', contentType: 'json' });
  const data = await request(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?${params}`);
  const now = data.currentConditions;
  const days = data.days?.slice(0, 5);
  if (now?.temp == null || !days?.length || days[0].tempmin == null || days[0].tempmax == null) throw new Error('No weather available for this location');
  return {
    icon: visualIcon(now.icon),
    weather: { temp: temperature(now.temp, format), temp_min: temperature(days[0].tempmin, format), temp_max: temperature(days[0].tempmax, format), feels_like: temperature(now.feelslike ?? now.temp, format), description: now.conditions, humidity: now.humidity, cloudiness: now.cloudcover, pressure: now.pressure, wind_speed: now.windspeed == null ? undefined : Math.round(now.windspeed / 3.6 * 10) / 10, wind_degrees: now.winddir, visibility: now.visibility == null ? undefined : now.visibility * 1000 },
    forecast: days.filter((day) => day.tempmin != null && day.tempmax != null).map((day) => ({ date: day.datetime, icon: visualIcon(day.icon), min: temperature(day.tempmin, format), max: temperature(day.tempmax, format) })),
  };
}

export async function getWeatherApi(location, format, key) {
  if (!key) throw new Error('WeatherAPI.com API key is missing');
  const params = new URLSearchParams({ key, q: location, days: '3', aqi: 'no', alerts: 'no' });
  const data = await request(`https://api.weatherapi.com/v1/forecast.json?${params}`);
  const now = data.current;
  const days = data.forecast?.forecastday;
  if (!now || !days?.length) throw new Error('No weather available for this location');
  return {
    icon: weatherApiIcon(now.condition.code, now.is_day === 1),
    weather: { temp: temperature(now.temp_c, format), temp_min: temperature(days[0].day.mintemp_c, format), temp_max: temperature(days[0].day.maxtemp_c, format), feels_like: temperature(now.feelslike_c, format), description: now.condition.text, humidity: now.humidity, cloudiness: now.cloud, pressure: now.pressure_mb, wind_speed: Math.round(now.wind_kph / 3.6 * 10) / 10, wind_degrees: now.wind_degree, visibility: now.vis_km * 1000 },
    forecast: days.map(({ date, day }) => ({ date, icon: weatherApiIcon(day.condition.code), max: temperature(day.maxtemp_c, format), min: temperature(day.mintemp_c, format) })),
  };
}

export async function getOpenWeather(location, format, key) {
  if (!key) throw new Error('OpenWeather API key is missing');
  const geo = await request(`https://api.openweathermap.org/geo/1.0/direct?${new URLSearchParams({ q: location, limit: '1', appid: key })}`);
  if (!geo.length) throw new Error('Location not found');
  const params = new URLSearchParams({ lat: geo[0].lat, lon: geo[0].lon, appid: key, units: 'metric' });
  const [now, forecast] = await Promise.all([
    request(`https://api.openweathermap.org/data/2.5/weather?${params}`),
    request(`https://api.openweathermap.org/data/2.5/forecast?${params}`),
  ]);
  if (!now.main || !now.weather?.length || !forecast.list?.length) throw new Error('No weather available for this location');
  const days = new Map();
  for (const entry of forecast.list) {
    const date = new Date((entry.dt + (forecast.city?.timezone || 0)) * 1000).toISOString().slice(0, 10);
    const day = days.get(date) || { date, icon: entry.weather[0].icon, min: entry.main.temp_min, max: entry.main.temp_max };
    day.min = Math.min(day.min, entry.main.temp_min);
    day.max = Math.max(day.max, entry.main.temp_max);
    days.set(date, day);
  }
  return {
    icon: now.weather[0].icon,
    weather: { temp: temperature(now.main.temp, format), temp_min: temperature(now.main.temp_min, format), temp_max: temperature(now.main.temp_max, format), feels_like: temperature(now.main.feels_like, format), description: now.weather[0].description, humidity: now.main.humidity, cloudiness: now.clouds?.all, pressure: now.main.pressure, wind_speed: now.wind?.speed, wind_degrees: now.wind?.deg, visibility: now.visibility },
    forecast: [...days.values()].slice(0, 5).map((day) => ({ ...day, min: temperature(day.min, format), max: temperature(day.max, format) })),
  };
}

const sinoptikIcon = (description, night = false) => {
  const text = description.toLowerCase();
  const suffix = night ? 'n' : 'd';
  if (/гръм|буря|thunder/.test(text)) return `11${suffix}`;
  if (/сняг|снеж|snow/.test(text)) return `13${suffix}`;
  if (/дъжд|валеж|rain|shower/.test(text)) return `10${suffix}`;
  if (/мъгла|fog/.test(text)) return `50${suffix}`;
  if (/облачно|cloudy/.test(text)) return /разкъс|частично|предимно|partly/.test(text) ? `02${suffix}` : `04${suffix}`;
  return `01${suffix}`;
};

export async function getSinoptik(url, format) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Invalid Sinoptik page'); }
  const hosts = ['www.sinoptik.bg', 'weather.sinoptik.bg', 'sinoptik.bg'];
  if (parsed.protocol !== 'https:' || !hosts.includes(parsed.hostname) || !/^\/[a-z0-9-]+-\d+\/?$/i.test(parsed.pathname) || parsed.search || parsed.hash || parsed.username || parsed.password)
    throw new Error('Invalid Sinoptik page');
  const response = await fetch(parsed.href);
  const resultUrl = new URL(response.url || parsed.href);
  if (!response.ok || resultUrl.protocol !== 'https:' || !hosts.includes(resultUrl.hostname)) throw new Error('Sinoptik page unavailable');
  const html = (await response.text()).replace(/<img\b[^>]*>/gi, '').replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  const read = (element) => {
    const match = element?.textContent.match(/-?\d+(?:[.,]\d+)?/);
    return match ? Number(match[0].replace(',', '.')) : undefined;
  };
  const now = doc.querySelector('.wfCurrentContent');
  const cards = [...doc.querySelectorAll('.wfNonCurrentContent')];
  const current = read(now?.querySelector('.wfCurrentTemp'));
  const description = now?.querySelector('.wfCurrentWindContainer strong')?.textContent.trim();
  const first = cards[0]?.querySelector('.wfNonCurrentTemp');
  const low = read(first);
  const high = read(first?.querySelector('[title]'));
  if (current == null || !description || low == null || high == null) throw new Error('Sinoptik forecast format changed');
  const details = {};
  for (const row of now.querySelectorAll('.wfCurrentWrapper')) {
    const name = row.querySelector('.wfCurrentHeading')?.textContent || '';
    const value = read(row.querySelector('.wfCurrentValue'));
    if (/Влажност|Humidity/i.test(name)) details.humidity = value;
    if (/налягане|Pressure/i.test(name)) details.pressure = value;
    if (/Видимост|Visibility/i.test(name) && value != null) details.visibility = value * 1000;
    if (/Облачност|Cloud/i.test(name)) details.cloudiness = value;
  }
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const forecast = cards.map((card, index) => {
    const temp = card.querySelector('.wfNonCurrentTemp');
    const min = read(temp);
    const max = read(temp?.querySelector('[title]'));
    const date = new Date(`${localDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), min: min == null ? null : temperature(min, format), max: max == null ? null : temperature(max, format), icon: sinoptikIcon(card.querySelector('.wfNonCurrentCond')?.textContent || '') };
  }).filter((day) => day.min != null && day.max != null);
  const feels = read(now.querySelector('.wfCurrentFeelTemp span'));
  return { displayLocation: doc.querySelector('.currentCity')?.textContent.trim(), icon: sinoptikIcon(description), weather: { temp: temperature(current, format), temp_min: temperature(low, format), temp_max: temperature(high, format), feels_like: temperature(feels ?? current, format), description, wind_speed: read(now.querySelector('.wfCurrentWind')), ...details }, forecast };
}
