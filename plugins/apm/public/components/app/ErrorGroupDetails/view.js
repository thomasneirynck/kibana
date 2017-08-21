import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import PageHeader from '../../shared/PageHeader';
import WiremockContainer from '../../shared/WiremockContainer';
import Breadcrumbs from '../../shared/Breadcrumbs';
import DetailView from './DetailView';

function loadErrorGroup(props) {
  const { appName, errorGroupingId, start, end } = props.urlParams;

  if (appName && errorGroupingId && start && end && !props.errorGroup.status) {
    props.loadErrorGroup({ appName, errorGroupingId, start, end });
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
    const { errorGroupingId } = this.props.urlParams;

    return (
      <div>
        <Breadcrumbs />
        <PageHeader title={`Error group: ${errorGroupingId}`} />
        <WiremockContainer>Occurrences</WiremockContainer>
        <WiremockContainer>Occurrences histogram</WiremockContainer>
        <DetailView
          errorGroup={this.props.errorGroup}
          urlParams={this.props.urlParams}
        />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupDetails, ['errorGroup']);
