import { uiText } from 'lib/translations';
import { PureComponent } from 'react';
import { BUG_REPORT, SHOW_DISCORD_LINK, DISCORD_SERVER } from './config/constants';

class ErrorBoundary extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      errorData: '',
      showReport: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error: true, errorData: errorInfo });
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  reportError() {
    window.open(
      `${BUG_REPORT}${encodeURIComponent('[Bug] New tab could not load')}`,
      '_blank',
      'noopener,noreferrer',
    );
    this.setState({
      showReport: false,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="criticalError">
          <div className="criticalError-message">
            <h1>{uiText('moo_could_not_load_this_page_edcf62')}</h1>
            <p>{uiText('reload_the_tab_to_try_again_if_the_problem_re_74c119')}</p>
            <div className="criticalError-actions">
              {this.state.showReport ? (
                <button onClick={() => this.reportError()}>{uiText('report_issue_0b07f3')}</button>
              ) : (
                <p>{uiText('continue_in_the_github_issue_form_3e7eff')}</p>
              )}
              <button onClick={() => window.location.reload()}>
                {uiText('reload_tab_f4515b')}
              </button>
              {SHOW_DISCORD_LINK && (
                <a href={`https://discord.gg/${DISCORD_SERVER}`} target="_blank" rel="noreferrer">
                  {uiText('support_discord_79f54b')}
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
