import React, { Component } from 'react';
import { timeout } from '../../lib';
import { HUMAN_READABLE_DELAY } from '../../lib/constants';
import {
  KuiButton,
  KuiButtonIcon,
} from 'ui_framework/components';

export class RefreshButton extends Component {
  state = {
    isRunning: false,
  };

  onClick = async () => {
    this.setState({ isRunning: true });

    try {
      await this.props.onClick();
      await timeout(HUMAN_READABLE_DELAY);
      this.setState({ isRunning: false });

    } catch (error) {
      this.setState({ isRunning: false });
    }
  }

  render() {
    const { buttonLabel, className } = this.props;
    const { isRunning } = this.state;

    return (
      <KuiButton
        buttonType="primary"
        className={ className }
        icon={ <KuiButtonIcon className="fa-refresh" /> }
        disabled={ isRunning }
        onClick={ this.onClick }
      >
        { isRunning ? 'Running...' : buttonLabel }
      </KuiButton>
    );
  }
}

RefreshButton.propTypes = {
  buttonLabel: React.PropTypes.string,
  className: React.PropTypes.string,
  onClick: React.PropTypes.func,
};

RefreshButton.defaultProps = {
  buttonLabel: 'Run',
  className: null,
  onClick: () => {},
};

