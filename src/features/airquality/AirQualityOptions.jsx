import { useRef, useState, useEffect } from 'react';
import { Header, Group, Row, Content, Action } from 'components/Layout/Settings';
import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import { OptionSelect, OptionToggle, OptionInput, numberChoices } from '../widgetKit/WidgetKit';
import { searchAirLocations, POLLUTANTS } from './airQualityStore';
import './airQuality.scss';

export default function AirQualityOptions() {
  useTranslationVersion();
  const [mode, setMode] = useState(
    () => localStorage.getItem('airQualityLocationMode') || 'weather',
  );
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [chosen, setChosen] = useState(() => localStorage.getItem('airQualityLocation') || '');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(() =>
    (localStorage.getItem('airQualityPollutants') ?? 'pm2_5,pm10,nitrogen_dioxide,ozone').split(
      ',',
    ),
  );
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  return (
    <>
      <Header
        title={uiText('air_title')}
        setting="airQualityEnabled"
        category="widgets"
        visibilityToggle
      />
      <Group>
        <WidgetSurface setting="surfaceAirQuality" category="airquality" />
        <OptionSelect
          category="airquality"
          name="airQualityDetailLevel"
          title={uiText('air_detail_level')}
          hint={uiText('air_detail_hint')}
          items={['basic', 'summary', 'detailed'].map((value) => ({
            value,
            text: uiText(`air_detail_${value}`),
          }))}
        />
        <OptionSelect
          category="airquality"
          name="airQualityScale"
          title={uiText('air_scale')}
          hint={uiText('air_scale_hint')}
          items={[
            { value: 'european', text: uiText('air_european') },
            { value: 'us', text: uiText('air_us') },
          ]}
        />
        <OptionSelect
          category="airquality"
          name="airQualityRefresh"
          title={uiText('widget_refresh_interval')}
          items={numberChoices([10, 15, 30, 60, 120], uiText('widget_minutes'))}
        />
        <OptionToggle
          category="airquality"
          name="airQualityShowForecast"
          title={uiText('air_show_forecast')}
          hint={uiText('air_forecast_hint')}
        />
      </Group>
      <Group>
        <OptionSelect
          category="airquality"
          name="airQualityLocationMode"
          title={uiText('air_location')}
          items={['weather', 'city', 'coordinates'].map((value) => ({
            value,
            text: uiText(`air_location_${value}`),
          }))}
          onChange={setMode}
        />
        {mode === 'weather' && (
          <Row>
            <Content subtitle={uiText('air_weather_location_hint')} />
          </Row>
        )}
        {mode === 'city' && (
          <Row>
            <Content title={uiText('air_find_city')} subtitle={chosen || uiText('air_city_hint')} />
            <Action>
              <form
                className="airLocationSearch"
                onSubmit={async (event) => {
                  event.preventDefault();
                  request.current?.abort();
                  const controller = new AbortController();
                  request.current = controller;
                  setSearching(true);
                  setError('');
                  try {
                    const results = await searchAirLocations(query, controller.signal);
                    if (!controller.signal.aborted) {
                      setPlaces(results);
                      if (!results.length) setError(uiText('air_no_locations'));
                    }
                  } catch {
                    if (!controller.signal.aborted) setError(uiText('air_error_network'));
                  } finally {
                    if (!controller.signal.aborted) setSearching(false);
                  }
                }}
              >
                <div className="text-field-container">
                  <div className="text-field">
                    <input
                      className="text-field-input"
                      aria-label={uiText('air_find_city')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      minLength={2}
                      maxLength={200}
                      required
                    />
                  </div>
                </div>
                <button className="featureButton" disabled={searching}>
                  {uiText('air_search')}
                </button>
                {places.map((place) => (
                  <button
                    className="featureButton featureButtonSecondary"
                    type="button"
                    key={`${place.latitude},${place.longitude}`}
                    onClick={() => {
                      localStorage.setItem('airQualityLocation', place.label);
                      localStorage.setItem('airQualityLatitude', String(place.latitude));
                      localStorage.setItem('airQualityLongitude', String(place.longitude));
                      setChosen(place.label);
                      setPlaces([]);
                      EventBus.emit('refresh', 'airquality');
                    }}
                  >
                    {place.label}
                  </button>
                ))}
                {error && <p role="alert">{error}</p>}
              </form>
            </Action>
          </Row>
        )}
        {mode === 'coordinates' && (
          <>
            <OptionInput
              category="airquality"
              name="airQualityLocation"
              title={uiText('air_location_label')}
              maxLength={200}
            />
            <OptionInput
              category="airquality"
              name="airQualityLatitude"
              title={uiText('air_latitude')}
              type="number"
              min="-90"
              max="90"
              step="any"
              validate={(value) =>
                value !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 90
              }
            />
            <OptionInput
              category="airquality"
              name="airQualityLongitude"
              title={uiText('air_longitude')}
              type="number"
              min="-180"
              max="180"
              step="any"
              validate={(value) =>
                value !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 180
              }
            />
          </>
        )}
        <OptionSelect
          category="airquality"
          name="airQualityDomain"
          title={uiText('air_domain')}
          hint={uiText('air_domain_hint')}
          items={['auto', 'cams_europe', 'cams_global'].map((value) => ({
            value,
            text: uiText(`air_domain_${value}`),
          }))}
        />
      </Group>
      <Group>
        <Row>
          <Content
            title={uiText('air_detail_detailed')}
            subtitle={uiText('air_detail_options_hint')}
          />
        </Row>
        <OptionToggle
          category="airquality"
          name="airQualityShowPollutants"
          title={uiText('air_show_pollutants')}
        />
        <Row>
          <Content title={uiText('air_pollutants')} subtitle={uiText('air_pollutants_hint')} />
          <Action>
            <div className="wkChecks">
              {POLLUTANTS.map((key) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={metrics.includes(key)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...metrics, key]
                        : metrics.filter((value) => value !== key);
                      setMetrics(next);
                      localStorage.setItem('airQualityPollutants', next.join(','));
                      EventBus.emit('refresh', 'airquality');
                    }}
                  />
                  {uiText(`air_metric_${key}`)}
                </label>
              ))}
            </div>
          </Action>
        </Row>
        <OptionToggle category="airquality" name="airQualityShowUV" title={uiText('air_show_uv')} />
        <OptionToggle
          category="airquality"
          name="airQualityShowPollen"
          title={uiText('air_show_pollen')}
          hint={uiText('air_pollen_coverage')}
        />
        <Row>
          <Content
            subtitle={
              <>
                <a
                  href="https://open-meteo.com/en/docs/air-quality-api"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open-Meteo / CAMS
                </a>{' '}
                · {uiText('air_source_hint')}
              </>
            }
          />
        </Row>
      </Group>
    </>
  );
}
