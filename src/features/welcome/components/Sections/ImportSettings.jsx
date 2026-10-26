import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import BackupImport from 'features/misc/sections/BackupImport';
import { Header, Content } from '../Layout';
import default_settings from 'utils/data/default_settings.json';

function ImportSettings(props) {
  useTranslationVersion();
  const imported = (backup) => {
    const settings = [];
    const data = backup.settings;
    Object.keys(data).forEach((setting) => {
      // Language and theme are shown in the first step; the rest are internal only.
      if (
        setting === 'language' ||
        setting === 'theme' ||
        setting === 'firstRun' ||
        setting === 'showWelcome' ||
        setting === 'showReminder'
      ) {
        return;
      }

      const defaultSetting = default_settings.find((i) => i.name === setting);
      if (defaultSetting !== undefined) {
        if (data[setting] === String(defaultSetting.value)) {
          return;
        }
      }

      settings.push({
        name: setting,
        value: data[setting],
      });
    });

    props.setImportedSettings(settings);
    props.switchTab(6);
  };
  return (
    <Content>
      <Header
        title={variables.getMessage('modals.welcome.sections.settings.title')}
        subtitle={variables.getMessage('modals.welcome.sections.settings.description')}
      />
      <BackupImport onImported={imported} />
      <span className="title">{variables.getMessage('modals.welcome.tip')}</span>
      <span className="subtitle">
        {variables.getMessage('modals.welcome.sections.settings.tip')}
      </span>
    </Content>
  );
}

export { ImportSettings as default, ImportSettings };
