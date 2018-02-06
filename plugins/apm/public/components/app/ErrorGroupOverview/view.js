import React, { Component } from 'react';
import PropTypes from 'prop-types';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader } from '../../shared/UIComponents';
import TabNavigation from '../../shared/TabNavigation';
import List from './List';

function maybeLoadList(props) {
  const { serviceName, start, end } = props.listArgs;

  if (serviceName && start && end && !props.errorGroupList.status) {
    props.loadErrorGroupList(props.listArgs);
  }
}

class ErrorGroupOverview extends Component {
  componentDidMount() {
    maybeLoadList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    maybeLoadList(nextProps);
  }

  render() {
    const { serviceName, location } = this.props.urlParams;

    return (
      <div>
        <PageHeader>{serviceName}</PageHeader>
        <TabNavigation />

        <List
          urlParams={this.props.urlParams}
          items={this.props.errorGroupList.data}
          location={location}
        />
      </div>
    );
  }
}

ErrorGroupOverview.propTypes = {
  location: PropTypes.object.isRequired
};

export default withErrorHandler(ErrorGroupOverview, ['errorGroupList']);
