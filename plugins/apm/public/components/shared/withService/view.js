import React, { Component } from 'react';

function maybeLoadService(props) {
  const { serviceName, start, end } = props.urlParams;
  if (serviceName && start && end && !props.service.status) {
    props.loadService({ serviceName, start, end });
  }
}

function getComponentWithService(WrappedComponent) {
  return class extends Component {
    componentDidMount() {
      maybeLoadService(this.props);
    }

    componentWillReceiveProps(nextProps) {
      maybeLoadService(nextProps);
    }

    render() {
      return (
        <WrappedComponent
          {...this.props.originalProps}
          service={this.props.service}
        />
      );
    }
  };
}

export default getComponentWithService;
