import { uiText } from 'lib/translations';
import variables from 'config/variables';
import { SHOW_DISCORD_LINK } from 'config/constants';
import { PureComponent } from 'react';
import { MdEmail } from 'react-icons/md';
import { FaDiscord } from 'react-icons/fa';
import { SiX } from 'react-icons/si';

import { Button } from 'components/Elements';
import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { checkForUpdate, currentVersion } from 'utils/updates';

class About extends PureComponent {
  constructor() {
    super();
    this.state = {
      version: currentVersion(),
      update: variables.getMessage('modals.main.settings.sections.about.version.checking_update'),
      loading: variables.getMessage('modals.main.loading'),
    };
    this.controller = new AbortController();
  }

  async getGitHubData() {
    const message = 'modals.main.settings.sections.about.version';

    try {
      const { current, latest, hasUpdate } = await checkForUpdate({
        signal: this.controller.signal,
      });

      if (this.controller.signal.aborted === true) return;

      this.setState({
        version: current,
        update: hasUpdate
          ? `${variables.getMessage(`${message}.update_available`)}: ${latest}`
          : variables.getMessage(`${message}.no_update`),
        loading: null,
      });
    } catch {
      if (this.controller.signal.aborted === true) return;

      this.setState({
        update: variables.getMessage(`${message}.error.title`),
        loading: variables.getMessage(`${message}.error.description`),
      });
    }
  }

  componentDidMount() {
    if (navigator.onLine === false || localStorage.getItem('offlineMode') === 'true') {
      this.setState({
        update: variables.getMessage('modals.main.marketplace.offline.description'),
        loading: variables.getMessage('modals.main.marketplace.offline.description'),
      });
      return;
    }

    this.getGitHubData();
  }

  componentWillUnmount() {
    this.controller.abort();
  }

  render() {
    return (
      <div className="modalInfoPage">
        <div className="settingsRow" style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexFlow: 'column', gap: '5px' }}>
            <img
              draggable={false}
              className="aboutLogo"
              src={'src/assets/icons/mue_about.png'}
              alt="Logo"
            />
            <div className="aboutText">
              <span className="title">{uiText('moo_1946c3')}</span>
              <span className="subtitle">
                {variables.getMessage('modals.main.settings.sections.about.version.title')}{' '}
                {this.state.version}
              </span>
              <span className="subtitle">({this.state.update})</span>
            </div>
            <div>
              <span className="subtitle">
                {uiText('copyright_2018_05bc08')}
                {new Date().getFullYear()}{' '}
                <a
                  className="link"
                  href={'https://github.com/apoapostolov'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {uiText('apostol_apostolov_32040d')}
                </a>
              </span>
            </div>
            <span className="subtitle">
              {uiText('licensed_under_the_bsd_3_clause_license_0947fe')}
            </span>
          </div>
        </div>

        <Row final={true}>
          <Content title={variables.getMessage('modals.main.settings.sections.about.contact_us')} />
          <Action>
            <div className="aboutContact">
              <Button
                type="linkIconButton"
                href={'mailto:' + variables.constants.EMAIL}
                icon={<MdEmail />}
                tooltipTitle="Email"
              />
              <Button
                type="linkIconButton"
                href={'https://x.com/' + variables.constants.TWITTER_HANDLE}
                icon={<SiX />}
                tooltipTitle="X (Twitter)"
              />
              {SHOW_DISCORD_LINK && (
                <Button
                  type="linkIconButton"
                  href={'https://discord.gg/' + variables.constants.DISCORD_SERVER}
                  icon={<FaDiscord />}
                  tooltipTitle="Discord"
                />
              )}
            </div>
          </Action>
        </Row>
      </div>
    );
  }
}

export { About as default, About };
