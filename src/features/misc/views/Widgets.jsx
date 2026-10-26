import { useState, useEffect, Fragment, Suspense, lazy, useMemo } from 'react';

import Clock from '../../time/Clock';
import QuickLinks from '../../quicklinks/QuickLinks';
import Date from '../../time/Date';
import AIAsk from '../../aiask/AIAsk';
import { WidgetsLayout } from 'components/Layout';
import {
  readOrder,
  readPlacement,
  readSecondLane,
  groupByZone,
  isWidgetEnabled,
  isFullWidth,
} from 'utils/widgets';

import EventBus from 'utils/eventbus';

// Lazy loaded because the weather icon module is large enough to delay first paint.
const Weather = lazy(() => import('../../weather/Weather'));
const QuickWeather = lazy(() => import('../../weather/QuickWeather'));
const GoogleMail = lazy(() => import('../../google/GoogleMail'));
const GoogleCalendar = lazy(() => import('../../google/GoogleCalendar'));
const GoogleTasks = lazy(() => import('../../google/GoogleTasks'));
const PhotoInfoWidget = lazy(() => import('../../background/components/PhotoInfoWidget'));
const Rss = lazy(() => import('../../rss/Rss'));

/**
 * A rail each side and the middle column; Overview decides which. The middle splits in two only
 * once a widget is moved aside, so an unsplit profile draws one column.
 */

const Widgets = () => {
  const online = localStorage.getItem('offlineMode') === 'false';
  const [layout, setLayout] = useState(() => ({
    order: readOrder(),
    placement: readPlacement(),
    lane: readSecondLane(),
  }));
  const [welcome, setWelcome] = useState(localStorage.getItem('showWelcome'));

  const enabled = (id) => isWidgetEnabled(id);

  const widgets = useMemo(
    () => ({
      time: enabled('time') && <Clock />,
      date: enabled('date') && <Date />,
      quicklinks: enabled('quicklinks') && online ? <QuickLinks /> : null,
      aiask: enabled('aiask') ? <AIAsk /> : null,
      weather: enabled('weather') && online ? <Weather /> : null,
      quickweather: enabled('quickweather') && online ? <QuickWeather /> : null,
      mail: enabled('mail') ? <GoogleMail /> : null,
      calendar: enabled('calendar') ? <GoogleCalendar /> : null,
      tasks: enabled('tasks') ? <GoogleTasks /> : null,
      photoinfo: enabled('photoinfo') ? <PhotoInfoWidget /> : null,
      rss: enabled('rss') ? <Rss /> : null,
    }),
    [layout], // Re-create widgets when the order or placement changes
  );

  useEffect(() => {
    const handleRefresh = (data) => {
      switch (data) {
        case 'widgets':
          return setLayout({
            order: readOrder(),
            placement: readPlacement(),
            lane: readSecondLane(),
          });
        case 'widgetsWelcome':
          setWelcome(localStorage.getItem('showWelcome'));
          localStorage.setItem('showWelcome', true);
          window.onbeforeunload = () => {
            localStorage.clear();
          };
          break;
        case 'widgetsWelcomeDone':
          setWelcome(localStorage.getItem('showWelcome'));
          window.onbeforeunload = null;
          break;
        default:
          break;
      }
    };

    EventBus.on('refresh', handleRefresh);
    return () => {
      EventBus.off('refresh', handleRefresh);
    };
  }, []);

  const groups = groupByZone(layout.order, layout.placement);

  const draw = (ids) =>
    ids.map((id) => {
      const widget = widgets[id];

      if (!widget) return null;

      return <Fragment key={id}>{widget}</Fragment>;
    });

  // A widget that is switched off is not on the page, so it cannot be half of a pair. The
  // lane outlives the switch, and counting a hidden partner as a card drew a two-column
  // page around nothing, with the cards that were left squeezed into the first column.
  // `widgets` is the same answer the drawing uses, so offline mode's missing cards count
  // as absent here too.
  const shown = groups.center.filter((id) => Boolean(widgets[id]));

  // Full-width lines read across the whole middle column and are never part of
  // the two-column pair, so they are drawn first.
  const lines = shown.filter((id) => isFullWidth(id));
  const cards = shown.filter((id) => !isFullWidth(id));

  // An empty lane is not a column: the split only exists once a card is moved in.
  const secondColumn = cards.filter((id) => layout.lane.includes(id));
  const firstColumn = cards.filter((id) => !layout.lane.includes(id));
  const split = secondColumn.length > 0;

  const middle = (
    <>
      {draw(lines)}
      {split ? (
        <div className="widgetPair">
          <div className="widgetColumn">{draw(firstColumn)}</div>
          <div className="widgetColumn">{draw(secondColumn)}</div>
        </div>
      ) : (
        draw(cards)
      )}
    </>
  );

  // The welcome screen replaces the widgets.
  return welcome !== 'false' ? (
    <WidgetsLayout />
  ) : (
    <Suspense fallback={<></>}>
      <div className="widgetRail widgetRail-left">{draw(groups.left)}</div>
      <WidgetsLayout split={split}>{middle}</WidgetsLayout>
      <div className="widgetRail widgetRail-right">{draw(groups.right)}</div>
    </Suspense>
  );
};

export { Widgets as default, Widgets };
