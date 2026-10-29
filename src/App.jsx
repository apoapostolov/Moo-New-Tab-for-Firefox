import { useTranslationVersion } from 'contexts/TranslationContext';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import Background from 'features/background/Background';
import Widgets from 'features/misc/views/Widgets';
import Scratch from 'features/scratch/Scratch';
import FocusRuntime from 'features/focus/FocusRuntime';
import Modals from 'features/misc/modals/Modals';
import { applySignature } from 'features/misc/signature';
import { loadSettings } from 'utils/settings';
import EventBus from 'utils/eventbus';
import variables from 'config/variables';
import { TranslationProvider } from 'contexts/TranslationContext';

const useAppSetup = () => {
  useEffect(() => {
    // The signature colour is a custom property on the root, so it has to be on
    // the document before anything paints with it.
    applySignature();

    loadSettings();
    const profileChanged = (event) => {
      if (event.key === 'profileRevision' && event.newValue) window.location.reload();
    };
    window.addEventListener('storage', profileChanged);

    const refreshHandler = (data) => {
      if (data === 'other') {
        loadSettings(true);
      }
    };

    EventBus.on('refresh', refreshHandler);

    variables.stats.tabLoad();

    return () => {
      EventBus.off('refresh', refreshHandler);
      window.removeEventListener('storage', profileChanged);
    };
  }, []);
};

const App = () => {
  useTranslationVersion();
  const [toastDisplayTime] = useState(
    () => Number(localStorage.getItem('toastDisplayTime')) || 2500,
  );
  const [showBackground, setShowBackground] = useState(
    () => localStorage.getItem('background') === 'true',
  );

  useEffect(() => {
    const refresh = (category) => {
      if (category === 'background')
        setShowBackground(localStorage.getItem('background') === 'true');
    };
    EventBus.on('refresh', refresh);
    return () => EventBus.off('refresh', refresh);
  }, []);

  useAppSetup();

  const languagecode = localStorage.getItem('language') || 'en_GB';

  return (
    <TranslationProvider initialLanguage={languagecode}>
      <FocusRuntime />
      {showBackground && <Background />}
      <ToastContainer
        position="top-center"
        autoClose={toastDisplayTime}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss
      />
      <div id="center">
        <Widgets />
        <Scratch />
        <Modals />
      </div>
    </TranslationProvider>
  );
};

export default App;
