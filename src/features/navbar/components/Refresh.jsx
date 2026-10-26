import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState, useEffect } from 'react';
import { useT } from 'contexts/TranslationContext';
import { MdRefresh } from 'react-icons/md';
import { Tooltip } from 'components/Elements';
import EventBus from 'utils/eventbus';

function Refresh() {
  useTranslationVersion();
  const t = useT();
  const [refreshText, setRefreshText] = useState('');
  const [refreshOption, setRefreshOption] = useState(localStorage.getItem('refreshOption') || '');

  useEffect(() => {
    const updateRefreshText = () => {
      const key =
        localStorage.getItem('refreshOption') === 'background'
          ? 'modals.main.settings.sections.background.title'
          : 'modals.main.settings.sections.appearance.navbar.refresh_options.page';
      setRefreshText(t(key));
    };
    const handleRefresh = (data) => {
      if (data === 'navbar' || data === 'background' || data === 'language') {
        setRefreshOption(localStorage.getItem('refreshOption'));
        updateRefreshText();
      }
    };

    EventBus.on('refresh', handleRefresh);
    updateRefreshText();

    return () => {
      EventBus.off('refresh', handleRefresh);
    };
  }, [t]);

  function refresh() {
    switch (refreshOption) {
      case 'background':
        return EventBus.emit('refresh', 'backgroundrefresh');
      default:
        window.location.reload();
    }
  }

  return (
    <Tooltip title={t('widgets.navbar.tooltips.refresh')} subtitle={refreshText}>
      <button
        className="navbarButton"
        onClick={refresh}
        aria-label={t('widgets.navbar.tooltips.refresh')}
      >
        <MdRefresh className="refreshicon topicons" />
      </button>
    </Tooltip>
  );
}

export { Refresh as default, Refresh };
