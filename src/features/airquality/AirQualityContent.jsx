import {
  MdAir,
  MdTimeline,
  MdGrain,
  MdScience,
  MdWbSunny,
  MdLocalFlorist,
  MdTraffic,
  MdFactory,
  MdLocalFireDepartment,
} from 'react-icons/md';
import { uiText } from 'lib/translations';
import { airForecast, airTrend, aqiBand, POLLEN } from './airQualityStore';

const METRIC_ICONS = {
  pm2_5: MdGrain,
  pm10: MdGrain,
  nitrogen_dioxide: MdTraffic,
  ozone: MdScience,
  sulphur_dioxide: MdFactory,
  carbon_monoxide: MdLocalFireDepartment,
};

export function AirQualityContent({
  data,
  scale,
  level,
  format,
  time,
  showForecast,
  showPollutants,
  metrics,
  showUV,
  showPollen,
}) {
  const index = data.current[scale + '_aqi'];
  const band = aqiBand(index, scale);
  const label = band === null ? uiText('air_unavailable') : uiText(`air_${scale}_band_${band}`);
  const scaleLabel = uiText(scale === 'us' ? 'air_us' : 'air_european');
  const forecast = airForecast(data, scale);
  const trend = airTrend(forecast, scale);
  const peakLabel =
    trend.peak &&
    uiText('air_peak', { value: format(trend.peak.value), time: time(trend.peak.time) });
  return (
    <>
      <div
        className="airHero"
        role="group"
        aria-label={`${scaleLabel} · ${format(index)} · ${label}`}
      >
        <MdAir className="airGlyph" aria-hidden="true" />
        <span className="airReading">
          <strong>{format(index)}</strong>
          <small>AQI</small>
        </span>
        <span className="airIdentity">
          <strong className={'airBand airBand-' + (band ?? 'unknown')} title={label}>
            {label}
          </strong>
          <span className="airLocation" title={data.location}>
            {data.location}
          </span>
        </span>
      </div>
      {level !== 'basic' && (
        <>
          <div className="airScale" role="img" aria-label={scaleLabel + ': ' + label}>
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                title={uiText(`air_${scale}_band_${i}`)}
                className={i === band ? 'airBand-' + i + ' active' : ''}
              />
            ))}
          </div>
          <span className="airScaleLabel">{scaleLabel}</span>
          {showForecast &&
            (trend.peak ? (
              <figure className="airTrend">
                <figcaption>
                  <span>
                    <MdTimeline aria-hidden="true" />
                    {uiText('air_forecast_title')}
                  </span>
                  <strong>{peakLabel}</strong>
                </figcaption>
                <svg viewBox="0 0 240 46" role="img" aria-label={peakLabel}>
                  <path className="airTrendBaseline" d="M4,40 H236" />
                  {trend.paths.map((path, i) => (
                    <path className="airTrendLine" d={path} key={i} />
                  ))}
                </svg>
                <div className="airTrendAxis">
                  <span>{time(forecast[0].time)}</span>
                  <span>{time(forecast.at(-1).time)}</span>
                </div>
              </figure>
            ) : (
              <p className="airForecastMissing">{uiText('air_no_forecast')}</p>
            ))}
        </>
      )}
      {level === 'detailed' && (
        <>
          {showPollutants && metrics.length > 0 && (
            <section className="airMeasurementGroup" aria-label={uiText('air_pollutants')}>
              <h3>
                <MdGrain aria-hidden="true" />
                {uiText('air_pollutants')}
                <small>µg/m³</small>
              </h3>
              <dl className="airMeasurements">
                {metrics.map((key) => {
                  const Icon = METRIC_ICONS[key];
                  return (
                    <div key={key}>
                      <dt>
                        <Icon aria-hidden="true" />
                        {uiText(`air_metric_${key}`)}
                      </dt>
                      <dd>{format(data.current[key])}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}
          {showUV && (
            <div className="airExposure">
              <span>
                <MdWbSunny aria-hidden="true" />
                {uiText('air_uv')}
              </span>
              <strong>{format(data.current.uv_index)}</strong>
            </div>
          )}
          {showPollen && (
            <details className="airPollen">
              <summary>
                <MdLocalFlorist aria-hidden="true" />
                {uiText('air_pollen')}
              </summary>
              <dl className="airMeasurements">
                {POLLEN.map((key) => (
                  <div key={key}>
                    <dt>{uiText(`air_${key}`)}</dt>
                    <dd>{format(data.current[key])}</dd>
                  </div>
                ))}
              </dl>
              <p>
                {uiText('air_grains')} · {uiText('air_pollen_coverage')}
              </p>
            </details>
          )}
        </>
      )}
    </>
  );
}
