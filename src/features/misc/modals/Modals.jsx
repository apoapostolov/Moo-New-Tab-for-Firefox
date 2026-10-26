import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';

import { MainModal } from 'components/Elements';
import Navbar from '../../navbar/Navbar';

import EventBus from 'utils/eventbus';
import { parseDeepLink, shouldAutoOpenModal, updateHash } from 'utils/deepLinking';

const Modals = () => {
  useTranslationVersion();
  const [mainModal, setMainModal] = useState(shouldAutoOpenModal);
  const [, setUpdateModal] = useState(false);
  const [, setAppsModal] = useState(false);
  const [deepLinkData, setDeepLinkData] = useState(() =>
    shouldAutoOpenModal() ? parseDeepLink() : null,
  );

  useEffect(() => {
    if (shouldAutoOpenModal()) {
      const linkData = parseDeepLink();
      variables.stats.postEvent('modal', `Opened via deep link: ${linkData.tab}`);
    } else {
      localStorage.setItem('showReminder', false);
    }
  }, []);

  useEffect(() => {
    const handleModalOpen = (data) => {
      if (data === 'openMainModal') {
        setDeepLinkData(parseDeepLink());
        setMainModal(true);
      }
    };
    EventBus.on('modal', handleModalOpen);
    return () => EventBus.off('modal', handleModalOpen);
  }, []);

  const toggleModal = (type, action) => {
    const modalSetters = {
      mainModal: setMainModal,
      updateModal: setUpdateModal,
      appsModal: setAppsModal,
    };
    modalSetters[type]?.(action);
    if (action !== false) {
      variables.stats.postEvent('modal', `Opened ${type.replace('Modal', '')}`);
      if (type === 'mainModal') updateHash('#settings');
    }
  };

  return (
    <>
      <Navbar openModal={(modal) => toggleModal(modal, true)} />
      <Modal
        closeTimeoutMS={300}
        id="modal"
        contentLabel="Moo settings"
        onRequestClose={() => toggleModal('mainModal', false)}
        isOpen={mainModal}
        className="Modal mainModal"
        overlayClassName="Overlay"
        ariaHideApp={true}
      >
        <MainModal
          key={JSON.stringify(deepLinkData)}
          modalClose={() => toggleModal('mainModal', false)}
          deepLinkData={deepLinkData}
        />
      </Modal>
    </>
  );
};

export { Modals as default, Modals };
