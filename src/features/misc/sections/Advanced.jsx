import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState } from 'react';
import Modal from 'react-modal';
import { MdDataUsage } from 'react-icons/md';

import { exportSettings } from 'utils/settings';

import { Text, Switch, Dropdown } from 'components/Form/Settings';
import { ResetModal, Button } from 'components/Elements';

import { Header, Section, Row, Content, Action } from 'components/Layout/Settings';
import BackupImport from './BackupImport';
import StorageManagement from './StorageManagement';
import { SHOW_EXPERIMENTAL } from 'config/constants';

import time_zones from 'features/time/timezones.json';

function AdvancedOptions({ currentSubSection, onSubSectionChange, sectionName }) {
  useTranslationVersion();
  const [resetModal, setResetModal] = useState(false);
  const ADVANCED_SECTION = 'modals.main.settings.sections.advanced';

  const [includeImages, setIncludeImages] = useState(false);
  const [dataError, setDataError] = useState('');
  const Data = () =>
    localStorage.getItem('welcomePreview') !== 'true' ? (
      <div className="backupData">
        <p>{uiText('save_your_settings_and_notes_or_bring_them_ba_f30abc')}</p>
        <label>
          <input
            type="checkbox"
            checked={includeImages}
            onChange={(event) => setIncludeImages(event.target.checked)}
          />
          {uiText('include_uploaded_pictures_66d00b')}
        </label>
        <div className="resetDataButtonsLayout">
          <Button
            label={uiText('save_a_backup_5835d2')}
            onClick={() =>
              exportSettings(includeImages).catch((error) => setDataError(error.message))
            }
          />
          <Button
            label={uiText('restore_settings_6562d0')}
            onClick={() => setResetModal('settings')}
          />
          <Button
            label={uiText('erase_all_local_data_e70015')}
            onClick={() => setResetModal('all')}
          />
        </div>
        <BackupImport />
        <StorageManagement />
        {dataError && <p role="alert">{dataError}</p>}
      </div>
    ) : (
      <p>{uiText('backups_and_reset_are_available_after_setup_37f176')}</p>
    );

  const isDataSection = currentSubSection === 'data';

  let header;
  if (isDataSection) {
    header = (
      <Header
        title={variables.getMessage(`${ADVANCED_SECTION}.title`)}
        secondaryTitle={variables.getMessage(`${ADVANCED_SECTION}.data`)}
        goBack={() => onSubSectionChange(null, sectionName)}
        report={false}
      />
    );
  } else {
    header = <Header title={variables.getMessage(`${ADVANCED_SECTION}.title`)} report={false} />;
  }

  return (
    <>
      {header}
      {isDataSection ? (
        <>
          {Data()}
          <Modal
            closeTimeoutMS={100}
            onRequestClose={() => setResetModal(false)}
            isOpen={Boolean(resetModal)}
            contentLabel={resetModal === 'all' ? 'Erase all local data' : 'Restore settings'}
            className="Modal resetmodal mainModal"
            overlayClassName="Overlay resetoverlay"
            ariaHideApp={true}
          >
            <ResetModal scope={resetModal} modalClose={() => setResetModal(false)} />
          </Modal>
        </>
      ) : (
        <>
          <Section
            title={variables.getMessage(`${ADVANCED_SECTION}.data`)}
            subtitle={variables.getMessage(`${ADVANCED_SECTION}.data_subtitle`)}
            onClick={() => onSubSectionChange('data', sectionName)}
            icon={<MdDataUsage />}
          />
          <Row>
            <Content
              title={variables.getMessage('modals.main.settings.sections.advanced.offline_mode')}
              subtitle={variables.getMessage(
                'modals.main.settings.sections.advanced.offline_subtitle',
              )}
            />
            <Action>
              <Switch name="offlineMode" element=".other" />
            </Action>
          </Row>

          <Row>
            <Content
              title={variables.getMessage('modals.main.settings.sections.advanced.timezone.title')}
              subtitle={variables.getMessage(
                'modals.main.settings.sections.advanced.timezone.subtitle',
              )}
            />
            <Action>
              <Dropdown
                name="timezone"
                category="timezone"
                items={[
                  {
                    value: 'auto',
                    text: variables.getMessage(
                      'modals.main.settings.sections.advanced.timezone.automatic',
                    ),
                  },
                  ...time_zones.map((timezone) => ({ value: timezone, text: timezone })),
                ]}
              />
            </Action>
          </Row>
          <Row>
            <Content
              title={variables.getMessage('modals.main.settings.sections.advanced.tab_name')}
              subtitle={variables.getMessage(
                'modals.main.settings.sections.advanced.tab_name_subtitle',
              )}
            />
            <Action>
              <Text name="tabName" default={variables.getMessage('tabname')} category="other" />
            </Action>
          </Row>
          <Row final={!SHOW_EXPERIMENTAL}>
            <Content
              title={variables.getMessage('modals.main.settings.sections.advanced.custom_css')}
              subtitle={variables.getMessage(
                'modals.main.settings.sections.advanced.custom_css_subtitle',
              )}
            />
            <Action>
              <Text name="customcss" textarea={true} category="other" customcss={true} />
            </Action>
          </Row>
          {SHOW_EXPERIMENTAL && (
            <Row final={true}>
              <Content
                title={variables.getMessage('modals.main.settings.sections.experimental.title')}
                subtitle={variables.getMessage(
                  'modals.main.settings.sections.advanced.experimental_warning',
                )}
              />
              <Action>
                <Switch
                  name="experimental"
                  text={variables.getMessage('modals.main.settings.enabled')}
                  element=".other"
                />
              </Action>
            </Row>
          )}
        </>
      )}
    </>
  );
}

export { AdvancedOptions as default, AdvancedOptions };
