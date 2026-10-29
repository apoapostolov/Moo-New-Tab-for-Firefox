import { fetchWithTimeout, withLock, online } from 'utils/requests';

export const AIR_SETTINGS = /^(airQuality|location$|offlineMode$)/;
export const airDetailLevel = () =>
  ['summary', 'detailed'].includes(localStorage.getItem('airQualityDetailLevel'))
    ? localStorage.getItem('airQualityDetailLevel')
    : 'basic';

/** Keep missing hours as gaps; never connect separate forecast periods. */
export function airForecast(data, scale, now = data?.updated) {
  if (!data?.hourly || !Number.isFinite(now)) return [];
  return data.hourly.time.flatMap((time, index) =>
    Number.isFinite(time) && time >= now && time < now + 86400000
      ? [{ time, value: numberReading(data.hourly[`${scale}_aqi`]?.[index]) }]
      : [],
  );
}

export function airTrend(forecast, scale) {
  const known = forecast.filter((item) => item.value !== null);
  if (!known.length) return { paths: [], peak: null, ceiling: 0 };
  const peak = known.reduce((a, b) => (b.value > a.value ? b : a));
  const step = scale === 'us' ? 50 : 20;
  const ceiling = Math.max(step, Math.ceil(peak.value / step) * step);
  const first = forecast[0].time;
  const duration = Math.max(3600000, forecast.at(-1).time - first);
  const paths = [];
  let path = '';
  let previous;
  for (const item of forecast) {
    if (item.value === null || (previous !== undefined && item.time - previous > 5400000)) {
      if (path) paths.push(path.includes(' L') ? path : `${path} l0,0`);
      path = '';
    }
    if (item.value !== null)
      path += `${path ? ' L' : 'M'}${(4 + ((item.time - first) / duration) * 232).toFixed(2)},${(40 - (item.value / ceiling) * 32).toFixed(2)}`;
    previous = item.time;
  }
  if (path) paths.push(path.includes(' L') ? path : `${path} l0,0`);
  return { paths, peak, ceiling };
}
export const POLLUTANTS = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];
export const POLLEN = [
  'alder_pollen',
  'birch_pollen',
  'grass_pollen',
  'mugwort_pollen',
  'olive_pollen',
  'ragweed_pollen',
];
export const numberReading = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const validTimestamp = (value) =>
  typeof value === 'number' && Number.isFinite(new Date(value).getTime());
export const coordinatesValid = (latitude, longitude) =>
  [latitude, longitude].every(
    (value) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''),
  ) &&
  Number.isFinite(Number(latitude)) &&
  Number.isFinite(Number(longitude)) &&
  Math.abs(Number(latitude)) <= 90 &&
  Math.abs(Number(longitude)) <= 180;
export function airSettings() {
  return {
    mode: localStorage.getItem('airQualityLocationMode') || 'weather',
    location: localStorage.getItem('airQualityLocation') || '',
    weather: localStorage.getItem('location') || '',
    latitude: localStorage.getItem('airQualityLatitude') || '',
    longitude: localStorage.getItem('airQualityLongitude') || '',
    scale: localStorage.getItem('airQualityScale') === 'us' ? 'us' : 'european',
    domain: ['cams_europe', 'cams_global'].includes(localStorage.getItem('airQualityDomain'))
      ? localStorage.getItem('airQualityDomain')
      : 'auto',
    refresh: Math.max(10, Math.min(120, Number(localStorage.getItem('airQualityRefresh')) || 30)),
  };
}
export function aqiBand(value, scale = 'european') {
  if (numberReading(value) === null) return null;
  const thresholds = scale === 'us' ? [50, 100, 150, 200, 300] : [20, 40, 60, 80, 100];
  return thresholds.findIndex((limit) => value <= limit) < 0
    ? 5
    : thresholds.findIndex((limit) => value <= limit);
}
export async function searchAirLocations(query, signal) {
  if (query.trim().length < 2) return [];
  const response = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: query.trim(), count: '5', language: (localStorage.getItem('language') || 'en').slice(0, 2), format: 'json' })}`,
    { signal },
  );
  if (!response.ok) throw new Error('network');
  const data = await response.json();
  return (data.results || [])
    .filter((item) => coordinatesValid(item.latitude, item.longitude))
    .map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
      label: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
    }));
}
const identity = (settings) =>
  JSON.stringify([
    settings.mode,
    settings.mode === 'weather' ? settings.weather : settings.location,
    settings.latitude,
    settings.longitude,
    settings.domain,
  ]);
const readingKeys = ['european_aqi', 'us_aqi', ...POLLUTANTS, ...POLLEN, 'uv_index'];
const validTimezone = (value) => {
  try {
    return typeof value === 'string' && Boolean(new Intl.DateTimeFormat('en', { timeZone: value }));
  } catch {
    return false;
  }
};
export function readAirCache(settings = airSettings()) {
  try {
    const data = JSON.parse(localStorage.getItem('airQualityCache') || 'null');
    return data?.identity === identity(settings) &&
      validTimestamp(data.updated) &&
      validTimestamp(data.measured) &&
      validTimezone(data.timezone) &&
      typeof data.location === 'string' &&
      data.current &&
      typeof data.current === 'object' &&
      Array.isArray(data.hourly?.time) &&
      data.hourly.time.length <= 168 &&
      data.hourly.time.every((value) => value === null || validTimestamp(value)) &&
      readingKeys.every(
        (key) =>
          (data.current[key] === null || numberReading(data.current[key]) !== null) &&
          Array.isArray(data.hourly[key]) &&
          data.hourly[key].length === data.hourly.time.length &&
          data.hourly[key].every((value) => value === null || numberReading(value) !== null),
      )
      ? data
      : null;
  } catch {
    return null;
  }
}
export function parseAirData(data, location, settings, now = Date.now()) {
  if (
    !data ||
    data.error ||
    !data.current ||
    !Number.isFinite(data.current.time) ||
    !validTimestamp(data.current.time * 1000) ||
    !data.hourly ||
    !Array.isArray(data.hourly.time)
  )
    throw new Error('no-data');
  const current = {};
  const hourly = {
    time: data.hourly.time.map((value) =>
      Number.isFinite(value) && validTimestamp(value * 1000) ? value * 1000 : null,
    ),
  };
  for (const key of readingKeys) {
    current[key] = numberReading(data.current[key]);
    hourly[key] = hourly.time.map((_, index) => numberReading(data.hourly[key]?.[index]));
  }
  if (current.european_aqi === null && current.us_aqi === null) throw new Error('no-data');
  return {
    identity: identity(settings),
    current,
    hourly,
    measured: data.current.time * 1000,
    timezone: validTimezone(data.timezone) ? data.timezone : 'UTC',
    location,
    updated: now,
  };
}
export async function loadAirQuality(force = false, signal) {
  const settings = airSettings();
  return withLock('moo-air-quality', async () => {
    const cached = readAirCache(settings);
    if (!online()) {
      if (cached) return { data: cached, error: new Error('offline') };
      throw new Error('offline');
    }
    if (!force && cached && Date.now() - cached.updated < settings.refresh * 60000)
      return { data: cached };
    try {
      let latitude = settings.latitude,
        longitude = settings.longitude;
      let label = settings.location;
      if (settings.mode === 'weather') {
        if (!settings.weather.trim()) throw new Error('location');
        const places = await searchAirLocations(settings.weather, signal);
        if (!places.length) throw new Error('location');
        ({ latitude, longitude, label } = places[0]);
      } else if (!coordinatesValid(latitude, longitude)) throw new Error('location');
      if (!label) label = `${latitude}, ${longitude}`;
      const fields = ['european_aqi', 'us_aqi', ...POLLUTANTS, ...POLLEN, 'uv_index'].join(',');
      const query = new URLSearchParams({
        latitude,
        longitude,
        current: fields,
        hourly: fields,
        forecast_hours: '24',
        timezone: 'auto',
        timeformat: 'unixtime',
        domains: settings.domain,
      });
      const response = await fetchWithTimeout(
        `https://air-quality-api.open-meteo.com/v1/air-quality?${query}`,
        { signal },
      );
      if (!response.ok) throw new Error(response.status === 429 ? 'rate' : 'network');
      const parsed = parseAirData(await response.json(), label, settings);
      if (signal?.aborted || identity(settings) !== identity(airSettings()))
        throw new Error('changed');
      try {
        localStorage.setItem('airQualityCache', JSON.stringify(parsed));
      } catch {
        /* The reading remains usable. */
      }
      return { data: parsed };
    } catch (error) {
      if (cached && !['location', 'changed'].includes(error.message) && !signal?.aborted)
        return { data: cached, error };
      throw error;
    }
  });
}
