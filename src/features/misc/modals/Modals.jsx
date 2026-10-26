import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';

import { MainModal } from 'components/Elements';
import Navbar from '../../navbar/Navbar';
import Preview from '../../helpers/preview/Preview';

import EventBus from 'utils/eventbus';
import { parseDeepLink, shouldAutoOpenModal, updateHash } from 'utils/deepLinking';

import Welcome from 'features/welcome/Welcome';

const Modals = () => {
  useTranslationVersion();
  const [mainModal, setMainModal] = useState(
    () => localStorage.getItem('showWelcome') !== 'true' && shouldAutoOpenModal(),
  );
  const [, setUpdateModal] = useState(false);
  const [welcomeModal, setWelcomeModal] = useState(
    () =>
      localStorage.getItem('showWelcome') === 'true' && window.location.search !== '?nointro=true',
  );
  const [, setAppsModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deepLinkData, setDeepLinkData] = useState(() =>
    localStorage.getItem('showWelcome') !== 'true' && shouldAutoOpenModal()
      ? parseDeepLink()
      : null,
  );

  useEffect(() => {
    // Preview mode blocks deep links and clears the hash.
    const isPreviewMode = localStorage.getItem('showWelcome') === 'true';
    if (isPreviewMode && shouldAutoOpenModal()) {
      window.history.replaceState(null, null, '/');
      return;
    }

    // A deep link takes priority over the welcome screen.
    if (shouldAutoOpenModal()) {
      const linkData = parseDeepLink();
      variables.stats.postEvent('modal', `Opened via deep link: ${linkData.tab}`);
      return;
    }

    if (
      localStorage.getItem('showWelcome') === 'true' &&
      window.location.search !== '?nointro=true'
    ) {
      variables.stats.postEvent('modal', 'Opened welcome');
    }

    if (window.location.search === '?nointro=true') {
      if (localStorage.getItem('showWelcome') === 'true') {
        localStorage.setItem('showWelcome', false);
        EventBus.emit('refresh', 'widgets');
        EventBus.emit('refresh', 'backgroundwelcome');
      }
    }

    // Only a natural visit clears the reminder, so a refresh still shows it.
    if (!shouldAutoOpenModal() && window.location.search !== '?nointro=true') {
      localStorage.setItem('showReminder', false);
    }
  }, []);

  useEffect(() => {
    const handleModalOpen = (data) => {
      if (data === 'openMainModal') {
        const linkData = parseDeepLink();
        setDeepLinkData(linkData);
        setMainModal(true);
      }
    };

    EventBus.on('modal', handleModalOpen);

    return () => {
      EventBus.off('modal', handleModalOpen);
    };
  }, []);

  const closeWelcome = async () => {
    localStorage.setItem('showWelcome', false);
    setWelcomeModal(false);

    EventBus.emit('refresh', 'widgetsWelcomeDone');
    EventBus.emit('refresh', 'widgets');
    EventBus.emit('refresh', 'backgroundwelcome');
  };

  const previewWelcome = () => {
    localStorage.setItem('showWelcome', false);
    localStorage.setItem('welcomePreview', true);
    setWelcomeModal(false);
    setPreview(true);
    EventBus.emit('refresh', 'widgetsWelcome');
  };

  const toggleModal = (type, action) => {
    const modalSetters = {
      mainModal: setMainModal,
      updateModal: setUpdateModal,
      welcomeModal: setWelcomeModal,
      appsModal: setAppsModal,
    };

    if (modalSetters[type]) {
      modalSetters[type](action);
    }

    if (action !== false) {
      variables.stats.postEvent('modal', `Opened ${type.replace('Modal', '')}`);
      // The hash is what deep-links back into the main modal.
      if (type === 'mainModal') {
        updateHash('#settings');
      }
    }
  };

  return (
    <>
      {welcomeModal === false && <Navbar openModal={(modal) => toggleModal(modal, true)} />}
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
      <Modal
        closeTimeoutMS={300}
        contentLabel="Set up Moo"
        onRequestClose={() => closeWelcome()}
        isOpen={welcomeModal}
        className="Modal welcomemodal mainModal"
        overlayClassName="Overlay mainModal"
        shouldCloseOnOverlayClick={false}
        ariaHideApp={true}
      >
        <Welcome modalClose={() => closeWelcome()} modalSkip={() => previewWelcome()} />
      </Modal>
      {preview && <Preview setup={() => window.location.reload()} />}
    </>
  );
};

export { Modals as default, Modals };
