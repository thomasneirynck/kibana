import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader, SectionHeader } from '../../shared/UIComponents';
import TabNavigation from '../../shared/TabNavigation';
import Charts from './Charts';
import List from './List';

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
    const { changeTransactionSorting, transactionSorting } = this.props;
    return (
      <div>
        <PageHeader>{appName}</PageHeader>
        <TabNavigation />
        <Charts />
        <SectionHeader>Requests</SectionHeader>
        <List
          appName={appName}
          type={transactionType}
          items={this.props.transactionList.data}
          changeTransactionSorting={changeTransactionSorting}
          transactionSorting={transactionSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(TransactionOverview, ['transactionList']);
