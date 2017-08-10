import React, { Component } from 'react';

function loadApp(props) {
  const { appName, start, end } = props.urlParams;
  if (appName && start && end && !props.app.status) {
    props.loadApp({ appName, start, end });
  }
}

function getComponentWithApp(WrappedComponent) {
  return class extends Component {
    componentDidMount() {
      loadApp(this.props);
    }

    componentWillReceiveProps(nextProps) {
      loadApp(nextProps);
    }

    render() {
      return (
        <WrappedComponent {...this.props.originalProps} app={this.props.app} />
      );
    }
  };
}

export default getComponentWithApp;
