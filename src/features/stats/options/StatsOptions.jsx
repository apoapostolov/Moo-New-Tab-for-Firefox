import { useTranslationVersion } from 'contexts/TranslationContext';
import { useState } from 'react';
import { MdShowChart, MdRestartAlt, MdDownload } from 'react-icons/md';
import { toast } from 'react-toastify';
import Modal from 'react-modal';

import { Button } from 'components/Elements';
import { Header, CustomActions } from 'components/Layout/Settings';
import { ClearModal } from './ClearModal';

import { saveFile } from 'utils/saveFile';
import { formatNumber } from 'utils/formatNumber';
import variables from 'config/variables';

const StatsElement = ({ title, value }) => (
  <div>
    <span className="subtitle">{title}</span>
    <span>{formatNumber(value)}</span>
  </div>
);

const Stats = () => {
  useTranslationVersion();
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('statsData')) || {});
  const [clearmodal, setClearmodal] = useState(false);

  const resetStats = () => {
    const emptyStats = {};
    localStorage.setItem('statsData', JSON.stringify(emptyStats));
    setStats(emptyStats);
    setClearmodal(false);
    toast(variables.getMessage('toasts.stats_reset'));
  };

  const downloadStats = () => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
    const filename = `mue_stats_${formattedDate}.json`;
    saveFile(JSON.stringify(stats, null, 2), filename);
  };

  const STATS_SECTION = 'modals.main.settings.sections.stats';

  return (
    <>
      <Header title={variables.getMessage(`${STATS_SECTION}.title`)} report={false}>
        <CustomActions>
          <Button
            type="settings"
            onClick={downloadStats}
            icon={<MdDownload />}
            label={variables.getMessage('widgets.background.download')}
          />
          <Button
            type="settings"
            onClick={() => setClearmodal(true)}
            icon={<MdRestartAlt />}
            label={variables.getMessage('modals.main.settings.buttons.reset')}
          />
        </CustomActions>
      </Header>
      <Modal
        closeTimeoutMS={100}
        onRequestClose={() => setClearmodal(false)}
        isOpen={clearmodal}
        className="Modal ClearModal mainModal"
        overlayClassName="Overlay resetoverlay"
        ariaHideApp={true}
      >
        <ClearModal modalClose={() => setClearmodal(false)} resetStats={resetStats} />
      </Modal>
      <div className="modalInfoPage stats">
        <div className="statSection rightPanel">
          <div className="statIcon">
            <MdShowChart />
          </div>
          <div className="statGrid">
            <StatsElement
              title={variables.getMessage(`${STATS_SECTION}.sections.tabs_opened`)}
              value={stats['tabs-opened'] || 0}
            />
            <StatsElement
              title={variables.getMessage(`${STATS_SECTION}.sections.backgrounds_favourited`)}
              value={stats['background-favourite'] || 0}
            />
            <StatsElement
              title={variables.getMessage(`${STATS_SECTION}.sections.backgrounds_downloaded`)}
              value={stats.feature ? stats.feature['background-download'] || 0 : 0}
            />
            <StatsElement
              title={variables.getMessage(`${STATS_SECTION}.sections.quicklinks_added`)}
              value={stats.feature ? stats.feature['quicklink-add'] || 0 : 0}
            />
            <StatsElement
              title={variables.getMessage(`${STATS_SECTION}.sections.settings_changed`)}
              value={stats.setting ? Object.keys(stats.setting).length : 0}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export { Stats as default, Stats };
