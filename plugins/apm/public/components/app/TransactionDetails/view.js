import React from 'react';
import PageHeader from '../../shared/PageHeader';
import Transaction from './Transaction';
import Distribution from './Distribution';
import Charts from './Charts';

function TransactionDetails({ urlParams }) {
  return (
    <div>
      <PageHeader title={urlParams.transactionName} />
      <Charts />
      <Distribution />
      <Transaction />
    </div>
  );
}

export default TransactionDetails;
