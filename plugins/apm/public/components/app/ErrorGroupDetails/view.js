import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import PageHeader from '../../shared/PageHeader';
import Breadcrumbs from '../../shared/Breadcrumbs';
import DetailView from './DetailView';
import Distribution from './Distribution';

function loadErrorGroup(props) {
  const { appName, errorGroupId, start, end } = props.urlParams;

  if (appName && errorGroupId && start && end && !props.errorGroup.status) {
    props.loadErrorGroup({ appName, errorGroupId, start, end });
  }
}

class ErrorGroupDetails extends Component {
  componentDidMount() {
    loadErrorGroup(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadErrorGroup(nextProps);
  }

  render() {
    const { errorGroupId } = this.props.urlParams;

    return (
      <div>
        <Breadcrumbs />
        <PageHeader title={`Error group: ${errorGroupId}`} />
        <Distribution />
        <DetailView
          errorGroup={this.props.errorGroup}
          urlParams={this.props.urlParams}
        />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupDetails, ['errorGroup']);
