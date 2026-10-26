import variables from 'config/variables';
import { PureComponent } from 'react';

import { MdErrorOutline, MdRefresh } from 'react-icons/md';

import { Button } from 'components/Elements';

class ErrorBoundary extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      errorData: '',
      showReport: true,
    };
  }

  /** React calls this on a render error; the returned object merges into state. */
  static getDerivedStateFromError(error) {
    console.error(error);
    return {
      error: true,
      errorData: error,
    };
  }

  reportError() {
    window.open(
      `${variables.constants.BUG_REPORT}${encodeURIComponent('[Bug] Settings page could not load')}`,
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
        <div className="emptyItems">
          <div className="emptyNewMessage">
            <MdErrorOutline />
            <span className="title">
              {variables.getMessage('modals.main.error_boundary.title')}
            </span>
            <span className="subtitle">
              {variables.getMessage('modals.main.error_boundary.message')}
            </span>
            <div className="buttonsRow">
              {this.state.showReport ? (
                <Button
                  type="settings"
                  icon={<MdErrorOutline />}
                  label={variables.getMessage('modals.main.error_boundary.report_error')}
                  onClick={() => this.reportError()}
                />
              ) : (
                <span className="subtitle">
                  {variables.getMessage('modals.main.error_boundary.sent')}
                </span>
              )}
              <Button
                type="settings"
                icon={<MdRefresh />}
                label={variables.getMessage('modals.main.error_boundary.refresh')}
                onClick={() => window.location.reload()}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
