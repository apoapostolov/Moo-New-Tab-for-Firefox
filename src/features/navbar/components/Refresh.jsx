import { useState, useEffect } from 'react';
import { useT } from 'contexts/TranslationContext';
import { MdRefresh } from 'react-icons/md';
import { Tooltip } from 'components/Elements';
import EventBus from 'utils/eventbus';
import variables from 'config/variables';

function Refresh() {
  const t = useT();
  const [refreshText, setRefreshText] = useState('');
  const [refreshOption, setRefreshOption] = useState(localStorage.getItem('refreshOption') || '');

  useEffect(() => {
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

  function updateRefreshText() {
    let text;
    switch (localStorage.getItem('refreshOption')) {
      case 'background':
        text = t('modals.main.settings.sections.background.title');
        break;
      default:
        text = t('modals.main.settings.sections.appearance.navbar.refresh_options.page');
        break;
    }

    setRefreshText(text);
  }

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
