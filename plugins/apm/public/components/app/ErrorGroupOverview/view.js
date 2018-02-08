import React, { Component } from 'react';
import PropTypes from 'prop-types';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader } from '../../shared/UIComponents';
import TabNavigation from '../../shared/TabNavigation';
import List from './List';
import { getKey } from '../../../store/apiHelpers';

function maybeLoadList(props) {
  const { serviceName, start, end } = props.urlParams;
  const keyArgs = { serviceName, start, end };
  const key = getKey(keyArgs);

  if (key && props.errorGroupList.key !== key) {
    props.loadErrorGroupList(keyArgs);
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
        <PageHeader title={serviceName || ''} />
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
