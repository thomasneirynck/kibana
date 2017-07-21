import React, { Component } from 'react';

import { LoggingForm } from './form';
import { LoggingInfo } from './info';
import { ErrorPanel } from '../error_panel';
import { InfoGroup } from '../info_group';
import { LoadingIndicator } from '../loading_indicator';
import { LOADING_STATUS } from '../../lib/constants';
import { getFromApi, putToApi } from '../../lib/request';
import { withViewState } from '../../lib/util/view_state';


export const LoggingView = withViewState({
  initialState: {
    isInfoCollapsed: false,
  },
  updaters: {
    toggleInfoCollapsed: (state) => () => ({
      isInfoCollapsed: !state.isInfoCollapsed,
    }),
  },
})(class LoggingView extends Component {
  static propTypes = {
    isInfoCollapsed: React.PropTypes.bool,
    toggleInfoCollapsed: React.PropTypes.func,
  }

  static defaultProps = {
    isInfoCollapsed: false,
    toggleInfoCollapsed: () => {},
  }

  state = {
    isLoggingEnabled: undefined,
    lastError: null,
    loadingStatus: LOADING_STATUS.UNINITIALIZED,
  };

  componentDidMount() {
    this.getLoggingStatus();
  }

  getLoggingStatus = () => {
    this.setState({
      loadingStatus: LOADING_STATUS.LOADING,
    });
    return getFromApi('/api/migration/deprecation_logging')
      .then(
        this.handleSuccess,
        this.handleFailure,
      );
  }

  toggleLoggingEnabled = () => {
    this.setState({
      loadingStatus: LOADING_STATUS.LOADING,
    });
    return putToApi('/api/migration/deprecation_logging', {
      isEnabled: !this.state.isLoggingEnabled,
    })
      .then(
        this.handleSuccess,
        this.handleFailure,
      );
  }

  handleSuccess = (response) => {
    this.setState({
      isLoggingEnabled: response.isEnabled,
      loadingStatus: LOADING_STATUS.SUCCESS,
    });
  }

  handleFailure = (error) => {
    this.setState({
      lastError: error.error,
      loadingStatus: LOADING_STATUS.FAILURE,
    });
  }

  render() {
    const { isLoggingEnabled, lastError, loadingStatus } = this.state;
    const { isInfoCollapsed, toggleInfoCollapsed } = this.props;

    return (
      <div className="kuiView">
        <div className="kuiViewContent kuiViewContent--constrainedWidth">
          <div className="kuiViewContentItem">
            <InfoGroup
              className="kuiVerticalRhythm"
              isCollapsed={ isInfoCollapsed }
              onChangeCollapsed={ toggleInfoCollapsed }
              title="Deprecation Logging"
            >
              <LoggingInfo className="kuiVerticalRhythm" />
            </InfoGroup>

            <h3 className="kuiSubTitle kuiVerticalRhythm">
              Cluster-wide settings
            </h3>

            { loadingStatus === LOADING_STATUS.LOADING
                ? <LoadingIndicator className="kuiVerticalRhythm" />
                : null
            }

            { loadingStatus === LOADING_STATUS.FAILURE
                ? <ErrorPanel className="kuiVerticalRhythm">
                    <p className="kuiText">
                      Failed to access logging settings, please try to <a className="kuiLink" onClick={ this.getLoggingStatus }>reload</a>.
                    </p>
                    <p className="kuiText">{ lastError }</p>
                  </ErrorPanel>
                : null
            }

            { loadingStatus === LOADING_STATUS.SUCCESS
                ? <LoggingForm
                    className="kuiVerticalRhythm"
                    isLoggingEnabled={ isLoggingEnabled }
                    onToggleLoggingEnabled={ this.toggleLoggingEnabled }
                  />
                : null
            }
          </div>
        </div>
      </div>
    );
  }
});
