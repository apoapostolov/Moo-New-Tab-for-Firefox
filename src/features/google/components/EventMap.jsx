import { useEffect, useRef, useState } from 'react';
import { MdMap, MdOpenInNew } from 'react-icons/md';
import { uiText } from 'lib/translations';
import { findEventPlaces, mapLinks } from '../services/eventMap';

export default function EventMap({ location, scope }) {
  const [state, setState] = useState({ places: [], loading: false, error: false, loaded: false });
  const [selected, setSelected] = useState(0);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const offline = localStorage.getItem('offlineMode') === 'true';
  const load = async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setState((previous) => ({ ...previous, loading: true, error: false }));
    try {
      const places = await findEventPlaces(location, { signal: request.signal, scope });
      if (!request.signal.aborted) {
        setSelected(0);
        setState({ places, loading: false, error: false, loaded: true });
      }
    } catch {
      if (!request.signal.aborted)
        setState({ places: [], loading: false, error: true, loaded: true });
    }
  };
  const place = state.places[selected];
  const links = place ? mapLinks(place) : null;
  return (
    <div className="gwEventMap">
      <button
        type="button"
        className="gwEventMapLoad"
        onClick={
          links
            ? () => {
                controller.current?.abort();
                setState({ places: [], loading: false, error: false, loaded: false });
              }
            : load
        }
        disabled={state.loading || (offline && !links)}
      >
        <MdMap aria-hidden="true" />
        {uiText(
          state.loading
            ? 'calendar_map_loading'
            : links
              ? 'calendar_map_hide'
              : 'calendar_map_show',
        )}
      </button>
      {offline && <p className="gwEventMuted">{uiText('calendar_map_offline')}</p>}
      {state.error && (
        <p className="gwEventMuted" role="status">
          {uiText('calendar_map_error')}
        </p>
      )}
      {state.loaded && !state.error && !state.places.length && (
        <p className="gwEventMuted" role="status">
          {uiText('calendar_map_empty')}
        </p>
      )}
      {links && (
        <>
          {state.places.length > 1 && (
            <label className="gwEventMapMatch">
              {uiText('calendar_map_match')}
              <select
                value={selected}
                onChange={(event) => setSelected(Number(event.target.value))}
              >
                {state.places.map((candidate, index) => (
                  <option key={`${candidate.lat}:${candidate.lon}:${index}`} value={index}>
                    {candidate.label || `${candidate.lat}, ${candidate.lon}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="gwEventMapFrame">
            <iframe
              title={uiText('calendar_map_title', { location: place.label || location })}
              src={links.embed}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              loading="lazy"
              tabIndex={-1}
            />
            <a
              href={links.page}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={uiText('calendar_map_open')}
            >
              <MdOpenInNew aria-hidden="true" />
            </a>
          </div>
          <p className="gwEventMapAttribution">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
            >
              © OpenStreetMap contributors
            </a>
          </p>
          {place.label && <p className="gwEventMuted">{place.label}</p>}
        </>
      )}
      {!links && (
        <a
          className="gwEventTextLink"
          href={`https://www.openstreetmap.org/search?${new URLSearchParams({ query: location })}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {uiText('calendar_map_open')}
          <MdOpenInNew aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
