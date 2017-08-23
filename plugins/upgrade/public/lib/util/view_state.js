import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';


function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}

export function withViewState({
  initialState = {},
  namespace,
  stateProperty = 'viewState',
  setStateProperty = 'setViewState',
  updaters = {},
}) {
  return function wrapComponentWithViewState(WrappedComponent) {
    const wrappedComponentName = getDisplayName(WrappedComponent);
    const viewStateKey = namespace || wrappedComponentName;
    const injectedPropNames = [
      ...Object.keys(initialState),
      ...Object.keys(updaters),
    ];

    return class ViewState extends React.Component {
      static displayName = `ViewState(${wrappedComponentName})`

      static propTypes = {
        ...(_.omit(WrappedComponent.propTypes, injectedPropNames)),
        [stateProperty]: PropTypes.object.isRequired,
        [setStateProperty]: PropTypes.func.isRequired,
      }

      static defaultProps = _.omit(WrappedComponent.defaultProps, injectedPropNames)

      cachedUpdaters = _.mapValues(updaters, (updater) => (...args) => (
        this.setViewState((state, props) => updater(state, props)(...args))
      ));

      setViewState = (updater) => (
        this.props[setStateProperty]((viewState) => ({
          ...viewState,
          [viewStateKey]: updater(viewState[viewStateKey], this.props),
        }))
      );

      componentDidMount() {
        this.setViewState((viewState) => ({
          ...initialState,
          ...viewState,
        }));
      }

      render() {
        return (
          <WrappedComponent
            {...this.props[stateProperty][viewStateKey]}
            {...this.cachedUpdaters}
            {...this.props}
          />
        );
      }
    };
  };
}
