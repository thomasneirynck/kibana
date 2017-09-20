import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import Breadcrumbs from '../../shared/Breadcrumbs';
import PageHeader from '../../shared/PageHeader';
import TabNavigation from '../../shared/TabNavigation';
import List from './List';

function loadErrorGroupList(props) {
  const { appName, start, end } = props.urlParams;

  if (appName && start && end && !props.errorGroupList.status) {
    props.loadErrorGroupList({ appName, start, end });
  }
}

class ErrorGroupOverview extends Component {
  componentDidMount() {
    loadErrorGroupList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadErrorGroupList(nextProps);
  }

  render() {
    const { appName } = this.props.urlParams;
    const { changeErrorGroupSorting, errorGroupSorting } = this.props;
    return (
      <div>
        <Breadcrumbs />
        <PageHeader title={`Errors for ${appName}`} />
        <TabNavigation />

        <List
          appName={appName}
          items={this.props.errorGroupList.data}
          changeErrorGroupSorting={changeErrorGroupSorting}
          errorGroupSorting={errorGroupSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupOverview, ['errorGroupList']);
