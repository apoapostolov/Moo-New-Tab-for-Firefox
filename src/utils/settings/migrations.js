/**
 * One-off repairs to a stored profile. Run before the first render, so no
 * component mounts holding a value that is about to change.
 */

// Show on Hover used to default to on. A profile that carries the stored 'true'
// from that default is reset once; the mark stops it recurring, so a later
// choice is never overridden.
const HOVER_MARK = 'navbarHoverDefaultOff';

// The Mue library is no longer an image source. Both keys that record it are
// rewritten, and the prefetch queue is cleared so no library image can linger.
const retireMueLibrary = () => {
  const type = localStorage.getItem('backgroundType');
  const api = localStorage.getItem('backgroundAPI');

  if (type !== 'api_mue' && type !== 'api' && api !== 'mue') return;

  if (type === 'api_mue' || type === 'api') localStorage.setItem('backgroundType', 'api_unsplash');
  if (api === 'mue') localStorage.setItem('backgroundAPI', 'unsplash');

  localStorage.removeItem('imageQueue');
};

/**
 * A switch that defaults to on must be stored once, or the control reads
 * unticked while the behaviour is already on. Only a missing value is filled,
 * so a later choice is never overridden.
 */
const seedPercentageFallback = () => {
  if (localStorage.getItem('percentageFallback') === null) {
    localStorage.setItem('percentageFallback', 'true');
  }
};

/**
 * Double-clicking the clock is on unless it is turned off, so the stored value has
 * to exist for the switch to read as on.
 */
const seedPercentageDoubleClick = () => {
  if (localStorage.getItem('percentageDoubleClick') === null) {
    localStorage.setItem('percentageDoubleClick', 'true');
  }
};

/**
 * Same trap as the Progress switch: Image Info refuses to draw without a known
 * location, so a profile that predates the control needs the answer stored.
 */
const seedPhotoInfoLocation = () => {
  if (localStorage.getItem('photoInfoRequiresLocation') === null) {
    localStorage.setItem('photoInfoRequiresLocation', 'true');
  }
};

/**
 * The triple click that hides the page is on unless it is turned off: the gesture is
 * only discoverable if it works, so a profile that predates the switch needs the value.
 */
const seedCinemaMode = () => {
  if (localStorage.getItem('cinemaMode') === null) {
    localStorage.setItem('cinemaMode', 'true');
  }
};

// The RSS card carried a dozen headlines by default. A profile that still holds that
// value from the old default is brought down to three once; the mark stops it recurring,
// so a later choice of twelve is never overridden.
const RSS_COUNT_MARK = 'rssCountDefaultThree';

const reseedRssCount = () => {
  if (localStorage.getItem(RSS_COUNT_MARK)) return;

  if (localStorage.getItem('rssItemCount') === '12') localStorage.setItem('rssItemCount', '3');

  localStorage.setItem(RSS_COUNT_MARK, 'true');
};

const runMigrations = () => {
  retireMueLibrary();
  seedPercentageFallback();
  seedPercentageDoubleClick();
  seedPhotoInfoLocation();
  seedCinemaMode();
  reseedRssCount();

  if (!localStorage.getItem(HOVER_MARK)) {
    if (localStorage.getItem('navbarHover') === 'true') localStorage.removeItem('navbarHover');

    localStorage.setItem(HOVER_MARK, 'true');
  }
};

export default runMigrations;
