import variables from 'config/variables';

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
    fullWidth: true,
  },
  {
    // The full card, not the one-line reading.
    id: 'weather',
    label: () => 'Weather Full',
    setting: 'weatherEnabled',
    zone: 'right',
  },
  {
    id: 'date',
    label: () => variables.getMessage('modals.main.settings.sections.date.title'),
    setting: 'date',
    fullWidth: true,
  },
  {
    id: 'quickweather',
    label: () => 'Weather Now',
    setting: 'quickWeatherEnabled',
    onByDefault: true,
    fullWidth: true,
  },
  {
    // A question typed here goes to an AI service, Google AI Mode by default.
    id: 'aiask',
    label: () => 'AI Ask',
    setting: 'aiAskEnabled',
    onByDefault: true,
    fullWidth: true,
  },
  {
    id: 'quicklinks',
    label: () => variables.getMessage('modals.main.settings.sections.quicklinks.title'),
    setting: 'quicklinksenabled',
  },
  {
    id: 'mail',
    label: () => 'Mail',
    setting: 'googleMailEnabled',
  },
  {
    id: 'calendar',
    label: () => 'Calendar',
    setting: 'googleCalendarEnabled',
  },
  {
    id: 'tasks',
    label: () => 'Tasks',
    setting: 'googleTasksEnabled',
  },
  {
    // Photographer credit card, driven by the `photoInformation` setting.
    id: 'photoinfo',
    label: () => 'Image Info',
    setting: 'photoInformation',
    zone: 'left',
  },
  {
    // Merged headlines from every feed configured under Settings, RSS. On by
    // default so it can say where feeds are added, rather than never appearing.
    id: 'rss',
    label: () => 'RSS',
    setting: 'rssEnabled',
    zone: 'right',
    onByDefault: true,
  },
];

export const ZONES = ['left', 'center', 'right'];

export const WIDGET_IDS = WIDGETS.map((widget) => widget.id);

export const DEFAULT_ORDER = ['time', 'weather', 'date', 'quickweather', 'quicklinks', 'aiask', 'rss'];

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
export function readOrder() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem('order'));
  } catch {
    stored = null;
  }

  let base = Array.isArray(stored) ? stored : DEFAULT_ORDER;

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

export function saveOrder(order) {
  localStorage.setItem('order', JSON.stringify(order));
}

/**
 * Zone per widget. Anything unstored or unrecognised falls back to the widget's
 * default zone, so nothing moves on upgrade.
 */
export function readPlacement() {
  let stored = {};

  try {
    stored = JSON.parse(localStorage.getItem('widgetPlacement')) || {};
  } catch {
    stored = {};
  }

  const placement = {};

  WIDGETS.forEach((widget) => {
    const zone = stored[widget.id];

    placement[widget.id] = ZONES.includes(zone) ? zone : defaultZone(widget);
  });

  return placement;
}

export function savePlacement(placement) {
  localStorage.setItem('widgetPlacement', JSON.stringify(placement));
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
export function readSecondLane() {
  try {
    const stored = JSON.parse(localStorage.getItem('widgetSecondLane'));

    return Array.isArray(stored) ? stored.filter((id) => WIDGET_IDS.includes(id)) : [];
  } catch {
    return [];
  }
}

export function saveSecondLane(ids) {
  localStorage.setItem('widgetSecondLane', JSON.stringify(ids));
}

/**
 * A widget with no stored value takes its own default; only Weather Now is on
 * by default.
 */
export function isWidgetEnabled(id) {
  const widget = widgetById(id);

  if (!widget) return false;

  const stored = localStorage.getItem(widget.setting);

  if (stored === null) return Boolean(widget.onByDefault);

  return stored === 'true';
}
