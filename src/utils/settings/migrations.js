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
 * Same trap as the Progress switch: Image Info refuses to draw without a known
 * location, so a profile that predates the control needs the answer stored.
 */
const seedPhotoInfoLocation = () => {
  if (localStorage.getItem('photoInfoRequiresLocation') === null) {
    localStorage.setItem('photoInfoRequiresLocation', 'true');
  }
};

const runMigrations = () => {
  retireMueLibrary();
  seedPercentageFallback();
  seedPhotoInfoLocation();

  if (!localStorage.getItem(HOVER_MARK)) {
    if (localStorage.getItem('navbarHover') === 'true') localStorage.removeItem('navbarHover');

    localStorage.setItem(HOVER_MARK, 'true');
  }
};

export default runMigrations;
