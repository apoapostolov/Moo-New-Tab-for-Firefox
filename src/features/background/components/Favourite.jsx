import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { MdStar, MdStarBorder } from 'react-icons/md';
import { recordHeartOnce } from '../api/imageCounters';

const Favourite = memo(({ tooltipText, credit, offline, pun, photoInfo, photoURL }) => {
  useTranslationVersion();
  const getInitialButton = () => {
    return localStorage.getItem('favourite') ? 'favourited' : 'unfavourited';
  };

  const [favourited, setFavourited] = useState(getInitialButton());
  const previousFavouritedRef = useRef(favourited);

  const favourite = useCallback(async () => {
    if (localStorage.getItem('favourite')) {
      localStorage.removeItem('favourite');
      setFavourited('unfavourited');
      tooltipText(variables.getMessage('widgets.quote.favourite'));
      variables.stats.postEvent('feature', 'Background favourite');
    } else {
      const type = localStorage.getItem('backgroundType');

      switch (type) {
        case 'colour':
          return;
        case 'random_colour':
        case 'random_gradient':
          localStorage.setItem(
            'favourite',
            JSON.stringify({
              type: localStorage.getItem('backgroundType'),
              url: document.getElementById('backgroundImage').style.background,
            }),
          );
          break;
        default: {
          let url =
            photoURL ||
            document
              .getElementById('backgroundImage')
              ?.style.backgroundImage.replace('url("', '')
              .replace('")', '');

          if (!url) {
            return;
          }

          if (url.startsWith('blob:')) {
            const reader = new FileReader();
            url = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              fetch(url)
                .then((res) => res.blob())
                .then((blob) => reader.readAsDataURL(blob));
            });
          }

          if (type === 'custom') {
            localStorage.setItem('favourite', JSON.stringify({ type, url }));
          } else {
            // The card may not render location or camera, so both are read defensively.
            const location = document.getElementById('infoLocation');
            const camera = document.getElementById('infoCamera');

            localStorage.setItem(
              'favourite',
              JSON.stringify({
                type,
                url,
                credit: credit || '',
                location: location?.innerText,
                camera: camera?.innerText,
                resolution: document.getElementById('infoResolution')?.textContent || '',
                offline,
                pun,
              }),
            );
          }
          break;
        }
      }

      recordHeartOnce(photoInfo);
      setFavourited('favourited');
      tooltipText(variables.getMessage('widgets.quote.unfavourite'));
      variables.stats.postEvent('feature', 'Background unfavourite');
    }
  }, [tooltipText, credit, offline, pun, photoInfo, photoURL]);

  const updateTooltip = useCallback(() => {
    if (tooltipText) {
      tooltipText(
        localStorage.getItem('favourite')
          ? variables.getMessage('widgets.quote.unfavourite')
          : variables.getMessage('widgets.quote.favourite'),
      );
    }
  }, [tooltipText]);

  useEffect(() => {
    updateTooltip();
  }, [updateTooltip]);

  useEffect(() => {
    if (previousFavouritedRef.current !== favourited) {
      updateTooltip();
      previousFavouritedRef.current = favourited;
    }
  }, [favourited, updateTooltip]);

  if (localStorage.getItem('backgroundType') === 'colour') {
    return null;
  }

  const buttons = {
    favourited: <MdStar onClick={favourite} className="topicons" />,
    unfavourited: <MdStarBorder onClick={favourite} className="topicons" />,
  };

  return buttons[favourited];
});

Favourite.displayName = 'Favourite';

export default Favourite;
