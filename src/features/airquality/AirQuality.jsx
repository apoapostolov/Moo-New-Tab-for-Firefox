import WidgetCard from 'components/Elements/WidgetCard/WidgetCard';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { EmptyState } from '../widgetKit/WidgetKit';
import useRemoteWidget from '../widgetKit/useRemoteWidget';
import {
  AIR_SETTINGS,
  airSettings,
  airDetailLevel,
  POLLUTANTS,
  loadAirQuality,
} from './airQualityStore';
import { AirQualityContent } from './AirQualityContent';
import './airQuality.scss';

export default function AirQuality() {
  const { language } = useTranslationVersion();
  const settings = airSettings();
  const level = airDetailLevel();
  const state = useRemoteWidget('airquality', AIR_SETTINGS, loadAirQuality, settings.refresh);
  const data = state.data;
  const locale = language.replaceAll('_', '-');
  const format = (value) =>
    value === null || value === undefined
      ? '—'
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const time = (value) =>
    new Date(value).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: data.timezone,
    });
  const error = state.error
    ? uiText(
        data
          ? 'widget_cached_error'
          : 'air_error_' +
              (['location', 'offline', 'rate', 'no-data'].includes(state.error.message)
                ? state.error.message
                : 'network'),
      )
    : null;
  const metrics = (
    localStorage.getItem('airQualityPollutants') ?? 'pm2_5,pm10,nitrogen_dioxide,ozone'
  )
    .split(',')
    .filter((value) => POLLUTANTS.includes(value));
  return (
    <WidgetCard
      as="section"
      widget="airquality"
      className={'airQualityWidget airDepth-' + level}
      aria-label={uiText('air_title')}
      aria-busy={state.loading || undefined}
    >
      {error && (
        <p className="wkNotice" role="status">
          {error}
        </p>
      )}
      {!data ? (
        state.loading ? (
          <p className="wkNotice">{uiText('widget_loading')}</p>
        ) : (
          <EmptyState widget="airquality">{uiText('air_setup')}</EmptyState>
        )
      ) : (
        <>
          <AirQualityContent
            data={data}
            scale={settings.scale}
            level={level}
            format={format}
            time={time}
            showForecast={localStorage.getItem('airQualityShowForecast') !== 'false'}
            showPollutants={localStorage.getItem('airQualityShowPollutants') !== 'false'}
            metrics={metrics}
            showUV={localStorage.getItem('airQualityShowUV') !== 'false'}
            showPollen={localStorage.getItem('airQualityShowPollen') === 'true'}
          />
        </>
      )}
    </WidgetCard>
  );
}
