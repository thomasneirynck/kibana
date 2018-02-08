import React, { Component } from 'react';
import { getKey } from '../../../store/apiHelpers';

function maybeLoadService(props) {
  const { serviceName, start, end } = props.urlParams;
  const key = getKey({ serviceName, start, end });

  if (key && props.service.key !== key) {
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
