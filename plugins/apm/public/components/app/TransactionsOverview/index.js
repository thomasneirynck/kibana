import React, { Component } from 'react';
import PageHeader from '../../shared/PageHeader/container';
import Navigation from './Navigation';
import WiremockContainer from '../../shared/WiremockContainer';
import TransactionList from './TransactionList';
import withApp from '../../shared/withApp/container';
import Breadcrumbs from '../../shared/Breadcrumbs/container';
import withErrorHandler from '../../shared/withErrorHandler';

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
        <Navigation
          appName={appName}
          type={transactionType}
          types={this.props.app.data.types}
        />
        <WiremockContainer />
        <h2>Requests</h2>
        <TransactionList
          appName={appName}
          type={transactionType}
          list={this.props.transactionList}
        />
      </div>
    );
  }
}

export default withApp(
  withErrorHandler(TransactionOverview, ['app', 'transactionList'])
);
