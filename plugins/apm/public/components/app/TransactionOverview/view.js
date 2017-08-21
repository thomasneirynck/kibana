import React, { Component } from 'react';
import PageHeader from '../../shared/PageHeader';
import TabNavigation from '../../shared/TabNavigation';
import WiremockContainer from '../../shared/WiremockContainer';
import Charts from './Charts';
import List from './List';
import Breadcrumbs from '../../shared/Breadcrumbs';
import withErrorHandler from '../../shared/withErrorHandler';

// TODO: Move this inside TransactionList component
function loadTransactionList(props) {
  const { appName, start, end, transactionType } = props.urlParams;

  if (
    appName &&
    start &&
    end &&
    transactionType &&
    !props.transactionList.status
  ) {
    props.loadTransactionList({ appName, start, end, transactionType });
  }
}

export class TransactionOverview extends Component {
  componentDidMount() {
    loadTransactionList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransactionList(nextProps);
  }

  render() {
    const { appName, transactionType } = this.props.urlParams;
    return (
      <div>
        <Breadcrumbs />
        <PageHeader title={appName} />
        <TabNavigation />
        <WiremockContainer />
        <Charts />
        <h2>Requests</h2>
        <List
          appName={appName}
          type={transactionType}
          list={this.props.transactionList}
        />
      </div>
    );
  }
}

export default withErrorHandler(TransactionOverview, ['transactionList']);
