import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader } from '../../shared/UIComponents';
import TabNavigation from '../../shared/TabNavigation';
import List from './List';

function loadErrorGroupList(props) {
  const { serviceName, start, end } = props.urlParams;

  if (serviceName && start && end && !props.errorGroupList.status) {
    props.loadErrorGroupList({ serviceName, start, end });
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
    const { serviceName } = this.props.urlParams;
    const { changeErrorGroupSorting, errorGroupSorting } = this.props;
    return (
      <div>
        <PageHeader>{serviceName}</PageHeader>
        <TabNavigation />

        <List
          serviceName={serviceName}
          items={this.props.errorGroupList.data}
          changeErrorGroupSorting={changeErrorGroupSorting}
          errorGroupSorting={errorGroupSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupOverview, ['errorGroupList']);
