import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import PageHeader from '../../shared/PageHeader/container';
import TabNavigation from '../../shared/TabNavigation/container';
import Breadcrumbs from '../../shared/Breadcrumbs/container';
import List from './List';

function loadErrorGroupList(props) {
  const { appName, start, end } = props.urlParams;

  if (appName && start && end && !props.errorGroupList.status) {
    props.loadErrorGroupList({ appName, start, end });
  }
}

class ErrorGroupList extends Component {
  componentDidMount() {
    loadErrorGroupList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadErrorGroupList(nextProps);
  }

  render() {
    const { appName } = this.props.urlParams;
    return (
      <div>
        <Breadcrumbs />
        <PageHeader title={'Errors for ' + appName} />
        <TabNavigation />
        <List appName={appName} list={this.props.errorGroupList} />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupList, ['errorGroupList']);
