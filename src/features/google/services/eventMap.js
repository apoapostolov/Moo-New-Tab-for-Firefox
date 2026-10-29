import { fetchWithTimeout } from 'utils/requests';

const point = (latitude, longitude, label = '') => {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') return null;
  const lat = Number(latitude),
    lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { lat, lon, label }
    : null;
};

export function locationCoordinates(location) {
  const text = String(location || '').trim();
  const coordinates = text.match(
    /^(?:geo:)?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*$|[?;])/i,
  );
  if (coordinates) return point(coordinates[1], coordinates[2], text);
  try {
    const url = new URL(text);
    if (url.hostname === 'openstreetmap.org' || url.hostname === 'www.openstreetmap.org') {
      const marker = point(url.searchParams.get('mlat'), url.searchParams.get('mlon'), text);
      if (marker) return marker;
      const match = url.hash.match(/^#map=\d+\/(-?[\d.]+)\/(-?[\d.]+)/);
      if (match) return point(match[1], match[2], text);
    }
    const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
    const match = query.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    return match ? point(match[1], match[2], text) : null;
  } catch {
    return null;
  }
}

export function mapLinks(place) {
  const { lat, lon } = place;
  const padding = 0.007;
  const centre = Math.max(-85, Math.min(85, lat));
  const bbox = [
    Math.max(-180, lon - padding),
    Math.max(-85.0511, centre - padding),
    Math.min(180, lon + padding),
    Math.min(85.0511, centre + padding),
  ].join(',');
  const params = new URLSearchParams({ bbox, layer: 'mapnik', marker: `${lat},${lon}` });
  return {
    embed: `https://www.openstreetmap.org/export/embed.html?${params}`,
    page: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
  };
}

// This lookup runs only after Show map, never while fetching or hovering the agenda.
// Results are short-lived memory entries, not personal addresses in exported settings.
const locations = new Map();
export function locationQuery(location) {
  try {
    const url = new URL(location);
    if (
      /^(?:www\.|maps\.)?google\.[a-z.]+$/.test(url.hostname) ||
      /^(?:www\.)?openstreetmap\.org$/.test(url.hostname)
    ) {
      const query = url.searchParams.get('q') || url.searchParams.get('query');
      if (query) return query;
      const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
      if (place) return decodeURIComponent(place[1]).replaceAll('+', ' ');
    }
  } catch {
    /* A normal street address is already a search query. */
  }
  return location;
}
export async function findEventPlaces(location, { signal, scope = '' } = {}) {
  signal?.throwIfAborted();
  const coordinates = locationCoordinates(location);
  if (coordinates) return [coordinates];
  if (localStorage.getItem('offlineMode') === 'true') throw new Error('offline');
  location = locationQuery(location);
  const key = `${scope}:${location}`;
  const cached = locations.get(key);
  if (cached && Date.now() - cached.at < 30 * 60000) return cached.places;
  const response = await fetchWithTimeout(
    `https://photon.komoot.io/api/?${new URLSearchParams({ q: location, limit: '3' })}`,
    { signal, credentials: 'omit', referrerPolicy: 'no-referrer' },
  );
  if (!response.ok) throw new Error('map-unavailable');
  const data = await response.json();
  signal?.throwIfAborted();
  const places = (data.features || [])
    .map((feature) => {
      const properties = feature.properties || {};
      const address = [
        properties.name,
        [properties.street, properties.housenumber].filter(Boolean).join(' '),
        properties.city || properties.town || properties.village,
        properties.state,
        properties.country,
      ];
      return feature.geometry?.type === 'Point'
        ? point(
            feature.geometry.coordinates?.[1],
            feature.geometry.coordinates?.[0],
            [...new Set(address.filter(Boolean))].join(', '),
          )
        : null;
    })
    .filter(Boolean);
  locations.set(key, { places, at: Date.now() });
  while (locations.size > 30) locations.delete(locations.keys().next().value);
  return places;
}
