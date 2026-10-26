/** Legacy `filter` shorthand; `getBackgroundOverlayStyle` is the backdrop-filter replacement. */
export function getBackgroundFilterStyle() {
  const blur = localStorage.getItem('blur') || '0';
  const brightness = localStorage.getItem('brightness') || '100';
  const backgroundFilter = localStorage.getItem('backgroundFilter');
  const backgroundFilterAmount = localStorage.getItem('backgroundFilterAmount') || '100';

  let filterString = `blur(${blur}px) brightness(${brightness}%)`;

  if (backgroundFilter && backgroundFilter !== 'none') {
    filterString += ` ${backgroundFilter}(${backgroundFilterAmount}%)`;
  }

  return filterString;
}

/**
 * Blur and extra effects go on backdrop-filter; brightness becomes a black
 * overlay, because backdrop-filter cannot darken the image by itself.
 */
export function getBackgroundOverlayStyle() {
  const blur = localStorage.getItem('blur') || '0';
  const brightness = localStorage.getItem('brightness') || '100';
  const backgroundFilter = localStorage.getItem('backgroundFilter');
  const backgroundFilterAmount = localStorage.getItem('backgroundFilterAmount') || '100';

  let backdropFilterString = `blur(${blur}px)`;

  if (backgroundFilter && backgroundFilter !== 'none') {
    backdropFilterString += ` ${backgroundFilter}(${backgroundFilterAmount}%)`;
  }

  // Opacity is the darkening amount: brightness 100% = 0, 0% = 1.
  const brightnessValue = parseInt(brightness, 10);
  const overlayOpacity = (100 - brightnessValue) / 100;

  return {
    backdropFilter: backdropFilterString,
    WebkitBackdropFilter: backdropFilterString, // Safari support
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
  };
}
