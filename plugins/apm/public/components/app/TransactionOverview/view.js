import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader, SectionHeader } from '../../shared/UIComponents';
import TabNavigation from '../../shared/TabNavigation';
import Charts from './Charts';
import List from './List';
import { getKey } from '../../../store/apiHelpers';

function loadTransactionList(props) {
  const { serviceName, start, end, transactionType } = props.urlParams;
  const key = getKey({ serviceName, start, end, transactionType });

  if (key && props.transactionList.key !== key) {
    props.loadTransactionList({ serviceName, start, end, transactionType });
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
    const { serviceName, transactionType } = this.props.urlParams;
    const {
      changeTransactionSorting,
      transactionSorting,
      transactionList
    } = this.props;

    return (
      <div>
        <PageHeader title={serviceName || ''} />
        <TabNavigation />
        <Charts />
        <SectionHeader>{transactionTypeLabel(transactionType)}</SectionHeader>
        <List
          serviceName={serviceName}
          type={transactionType}
          items={transactionList.data}
          changeTransactionSorting={changeTransactionSorting}
          transactionSorting={transactionSorting}
        />
      </div>
    );
  }
}

function transactionTypeLabel(type) {
  return type === 'request' ? 'Request' : type;
}

export default withErrorHandler(TransactionOverview, ['transactionList']);
