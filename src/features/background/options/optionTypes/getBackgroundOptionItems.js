import variables from 'config/variables';

// `api_mue` and the legacy bare `api` are kept so an older profile still gets an
// image settings panel; both resolve to Unsplash.
export const API_BACKGROUND_TYPES = [
  'api',
  'api_mue',
  'api_unsplash',
  'api_coverr',
  'api_mixkit',
  'api_live',
  'api_pixabay',
  'api_pexels',
];

export function isApiBackgroundType(type) {
  return API_BACKGROUND_TYPES.includes(type);
}

/** Which API a background type uses; everything unanswered is Unsplash. */
export function getApiForBackgroundType(type) {
  if (type === 'api_coverr') return 'coverr';
  if (type === 'api_mixkit') return 'mixkit';
  if (type === 'api_live') return 'live';
  if (type === 'api_pixabay') return 'pixabay';
  if (type === 'api_pexels') return 'pexels';
  // Unsplash answers every remaining case.
  return 'unsplash';
}

/** Folds the legacy `api` and `api_mue` into `api_unsplash`. */
export function normalizeBackgroundType(type) {
  if (type !== 'api' && type !== 'api_mue') return type;
  return 'api_unsplash';
}

export function getBackgroundOptionItems(marketplaceEnabled) {
  // Order is deliberate: Unsplash, Coverr (the keyless video source), then the
  // rest by monthly visits, Pixabay before Pexels.
  return [
    marketplaceEnabled && {
      value: 'photo_pack',
      text: variables.getMessage('modals.main.marketplace.title'),
    },
    {
      value: 'api_unsplash',
      text: variables.getMessage('modals.main.settings.sections.background.type.unsplash'),
    },
    {
      value: 'api_coverr',
      text: variables.getMessage('modals.main.settings.sections.background.type.coverr'),
    },
    {
      value: 'api_mixkit',
      text: variables.getMessage('modals.main.settings.sections.background.type.mixkit'),
    },
    {
      value: 'api_live',
      text: variables.getMessage('modals.main.settings.sections.background.type.live'),
    },
    {
      value: 'api_pixabay',
      text: variables.getMessage('modals.main.settings.sections.background.type.pixabay'),
    },
    {
      value: 'api_pexels',
      text: variables.getMessage('modals.main.settings.sections.background.type.pexels'),
    },
    {
      value: 'custom',
      text: variables.getMessage('modals.main.settings.sections.background.type.custom_image'),
    },
    {
      value: 'colour',
      text: variables.getMessage('modals.main.settings.sections.background.type.custom_colour'),
    },
    {
      value: 'random_colour',
      text: variables.getMessage('modals.main.settings.sections.background.type.random_colour'),
    },
    {
      value: 'random_gradient',
      text: variables.getMessage('modals.main.settings.sections.background.type.random_gradient'),
    },
  ];
}
