import { memo } from 'react';

import PhotoInformation from './PhotoInformation';
import { useCurrentPhoto } from '../photoStore';

import '../scss/_photoinformation.scss';

/**
 * PhotoInformation already answers for the Display setting that shows and hides
 * the card, so this only decides whether there is a photo to credit at all.
 */
/**
 * Pexels, Pixabay and video sources carry no location; with the setting on, a
 * credit with no place on it is not drawn.
 */
const hasLocation = (info) => Boolean(info?.location && info.location !== 'N/A');

function PhotoInfoWidget() {
  const { photoInfo, api, url } = useCurrentPhoto();

  if (!photoInfo?.credit || photoInfo.hidden) return null;

  const wantsLocation = localStorage.getItem('photoInfoRequiresLocation') !== 'false';

  if (wantsLocation && !hasLocation(photoInfo)) return null;

  return <PhotoInformation info={photoInfo} api={api} url={url} />;
}

export default memo(PhotoInfoWidget);
