import variables from 'config/variables';
import { uiText } from 'lib/translations';

/**
 * Every widget in one list, read by both the settings panel and the page so the
 * two cannot disagree. `zone` is the default placement; widgets without one sit
 * in the centre column.
 */
export const WIDGETS = [
  {
    id: 'time',
    label: () => variables.getMessage('modals.main.settings.sections.time.title'),
    setting: 'time',
    onByDefault: true,
    fullWidth: true,
  },
  {
    // The full card, not the one-line reading.
    id: 'weather',
    label: () => uiText('weather_full_widget'),
    setting: 'weatherEnabled',
    onByDefault: true,
    zone: 'left',
  },
  {
    id: 'date',
    label: () => variables.getMessage('modals.main.settings.sections.date.title'),
    setting: 'date',
    fullWidth: true,
  },
  {
    id: 'quickweather',
    label: () => uiText('weather_now_69ed32'),
    setting: 'quickWeatherEnabled',
    fullWidth: true,
  },
  {
    // Search and answer services share a query.
    id: 'aiask',
    label: () => uiText('search_ask_bar'),
    setting: 'aiAskEnabled',
    onByDefault: true,
    fullWidth: true,
  },
  {
    id: 'quicklinks',
    label: () => variables.getMessage('modals.main.settings.sections.quicklinks.title'),
    setting: 'quicklinksenabled',
    fullWidth: true,
  },
  {
    id: 'mail',
    label: () => uiText('mail_92379c'),
    setting: 'googleMailEnabled',
  },
  {
    id: 'calendar',
    label: () => uiText('calendar_adab50'),
    setting: 'googleCalendarEnabled',
  },
  {
    id: 'tasks',
    label: () => uiText('tasks_090ec5'),
    setting: 'googleTasksEnabled',
  },
  {
    // Photographer credit card, driven by the `photoInformation` setting.
    id: 'photoinfo',
    label: () => uiText('image_info_widget'),
    setting: 'photoInformation',
    zone: 'left',
  },
  {
    id: 'rss',
    label: () => uiText('rss_fcae0f'),
    setting: 'rssEnabled',
    zone: 'center',
  },
  {
    id: 'countdown',
    label: () => uiText('countdown_title'),
    setting: 'countdownEnabled',
    zone: 'center',
  },
  {
    id: 'portfolio',
    label: () => uiText('portfolio_title'),
    setting: 'portfolioEnabled',
    zone: 'center',
  },
  { id: 'habits', label: () => uiText('habits_title'), setting: 'habitsEnabled', zone: 'center' },
  {
    id: 'airquality',
    label: () => uiText('air_title'),
    setting: 'airQualityEnabled',
    zone: 'left',
  },
  {
    id: 'bookmarks',
    label: () => uiText('bookmarks_title'),
    setting: 'bookmarksEnabled',
    zone: 'center',
  },
  { id: 'github', label: () => 'GitHub', setting: 'githubEnabled', zone: 'center' },
];

export const ZONES = ['left', 'center', 'right'];

export const WIDGET_IDS = WIDGETS.map((widget) => widget.id);

export const DEFAULT_ORDER = [
  'time',
  'weather',
  'date',
  'quickweather',
  'quicklinks',
  'aiask',
  'rss',
  'mail',
  'calendar',
  'tasks',
  'portfolio',
  'countdown',
  'habits',
  'airquality',
  'github',
  'bookmarks',
  'photoinfo',
];

export const widgetById = (id) => WIDGETS.find((widget) => widget.id === id);

/**
 * These are lines rather than cards: full width of the centre column, never put
 * in one of its halves.
 */
export const isFullWidth = (id) => Boolean(widgetById(id)?.fullWidth);

const defaultZone = (widget) => widget.zone || 'center';

/**
 * Order for reading a profile: legacy names repaired, unknown ids dropped, and
 * any widget this build knows about appended.
 */
export function readOrder(profile = 'standard') {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem(profile === 'focus' ? 'focusWidgetOrder' : 'order'));
  } catch {
    stored = null;
  }

  let base =
    Array.isArray(stored) && stored.length
      ? stored
      : profile === 'focus'
        ? readOrder()
        : DEFAULT_ORDER;

  base = base.map((id) => (id === 'weatherline' ? 'quickweather' : id));
  base = base.filter((id, index, all) => WIDGET_IDS.includes(id) && all.indexOf(id) === index);

  if (!base.includes('quickweather') && base.includes('weather')) {
    base.splice(base.indexOf('weather') + 1, 0, 'quickweather');
  }

  WIDGET_IDS.forEach((id) => {
    if (!base.includes(id)) base.push(id);
  });

  return base;
}

export function saveOrder(order, profile = 'standard') {
  localStorage.setItem(profile === 'focus' ? 'focusWidgetOrder' : 'order', JSON.stringify(order));
}

/**
 * Zone per widget. Anything unstored or unrecognised falls back to the widget's
 * default zone, so nothing moves on upgrade.
 */
export function readPlacement(profile = 'standard') {
  let stored = {};

  try {
    stored =
      JSON.parse(
        localStorage.getItem(profile === 'focus' ? 'focusWidgetPlacement' : 'widgetPlacement'),
      ) || {};
  } catch {
    stored = {};
  }

  const placement = {};
  const inherited = profile === 'focus' ? readPlacement() : {};

  WIDGETS.forEach((widget) => {
    const zone = stored[widget.id];

    placement[widget.id] = ZONES.includes(zone)
      ? zone
      : inherited[widget.id] || defaultZone(widget);
  });

  return placement;
}

export function savePlacement(placement, profile = 'standard') {
  localStorage.setItem(
    profile === 'focus' ? 'focusWidgetPlacement' : 'widgetPlacement',
    JSON.stringify(placement),
  );
}

/**
 * Order split into the three zones, the widget order preserved within each.
 */
export function groupByZone(order, placement) {
  const groups = { left: [], center: [], right: [] };

  order.forEach((id) => {
    const zone = placement[id] || 'center';

    (groups[zone] || groups.center).push(id);
  });

  return groups;
}

export function placementFromGroups(groups) {
  const placement = {};

  ZONES.forEach((zone) => {
    groups[zone].forEach((id) => {
      placement[id] = zone;
    });
  });

  return placement;
}

/**
 * Widgets in the centre column's second lane. An empty list means the page draws
 * a single column, which is why nothing is stored until the lane is used.
 */
export function readSecondLane(profile = 'standard') {
  try {
    const raw = localStorage.getItem(
      profile === 'focus' ? 'focusWidgetSecondLane' : 'widgetSecondLane',
    );
    if (profile === 'focus' && raw === null) return readSecondLane();
    const stored = JSON.parse(raw);

    return Array.isArray(stored)
      ? stored.filter((id) => WIDGET_IDS.includes(id) && !isFullWidth(id))
      : [];
  } catch {
    return [];
  }
}

export function saveSecondLane(ids, profile = 'standard') {
  localStorage.setItem(
    profile === 'focus' ? 'focusWidgetSecondLane' : 'widgetSecondLane',
    JSON.stringify(ids),
  );
}

/**
 * A widget with no stored value uses its default visibility.
 */
export function isWidgetEnabled(id, profile = 'standard') {
  const widget = widgetById(id);

  if (!widget) return false;

  if (profile === 'focus') {
    const visibility = readFocusVisibility();
    if (typeof visibility[id] === 'boolean') return visibility[id];
    if (id === 'quicklinks' && localStorage.getItem('quicklinksSeparateFocus') === 'true')
      return true;
    return ['time', 'date'].includes(id) && isWidgetEnabled(id);
  }

  const stored = localStorage.getItem(widget.setting);

  if (stored === null) return Boolean(widget.onByDefault);

  return stored === 'true';
}

function readFocusVisibility() {
  try {
    const value = JSON.parse(localStorage.getItem('focusWidgetVisibility'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function setWidgetEnabled(id, enabled, profile = 'standard') {
  const widget = widgetById(id);
  if (!widget) return;
  if (profile === 'focus') {
    localStorage.setItem(
      'focusWidgetVisibility',
      JSON.stringify({ ...readFocusVisibility(), [id]: Boolean(enabled) }),
    );
  } else {
    localStorage.setItem(widget.setting, String(Boolean(enabled)));
  }
}
