import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
  KuiConfirmModal,
  KuiModalOverlay,
} from 'ui_framework/components';


export function withNavigationBlocker({ predicate }) {
  return function wrapComponentWithNavigationBlocker(WrappedComponent) {
    return class NavigationBlocker extends Component {
      static propTypes = {
        navigateTo: PropTypes.func,
        registerRouteChangeListener: PropTypes.func,
      }

      static defaultProps = {
        navigateTo: () => {},
        registerRouteChangeListener: () => {},
      }

      state = {
        lastTargetUrl: null,
        overrideBlock: false,
      }

      componentDidMount() {
        this.unregisterRouteChangeListener = this.props.registerRouteChangeListener(this.handleRouteChange);
      }

      componentWillUnmount() {
        if (_.isFunction(this.unregisterRouteChangeListener)) {
          this.unregisterRouteChangeListener();
        }
      }

      overrideNavigationBlock = () => {
        const { lastTargetUrl } = this.state;

        this.setState({
          lastTargetUrl: null,
          overrideBlock: true,
        }, () => this.props.navigateTo(lastTargetUrl));
      }

      resetNavigationBlock = () => {
        this.setState({
          lastTargetUrl: null,
          overrideBlock: false,
        });
      }

      handleRouteChange = (targetUrl) => {
        if (this.isNavigationBlocked()) {
          this.setState({
            lastTargetUrl: targetUrl,
          });

          return true;
        }
      }

      isNavigationBlocked = () => (
        predicate(this.state, this.props)
        && !this.state.overrideBlock
      );

      render() {
        const showModal = (
          this.isNavigationBlocked()
          && this.state.lastTargetUrl
        );

        return (
          <div>
            <WrappedComponent {...this.props} />
            { !showModal ? null : (
              <KuiModalOverlay>
                <KuiConfirmModal
                  cancelButtonText="Stay"
                  confirmButtonText="Leave"
                  message="Leaving this page would abandon the currently running
                    actions. Are you sure you want to leave?"
                  onConfirm={this.overrideNavigationBlock}
                  onCancel={this.resetNavigationBlock}
                />
              </KuiModalOverlay>
            ) }
          </div>
        );
      }
    };
  };
}
