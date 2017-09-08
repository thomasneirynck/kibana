import React from 'react';
import PageHeader from '../../shared/PageHeader';
import Transaction from './Transaction';
import Breadcrumbs from '../../shared/Breadcrumbs';
import Distribution from './Distribution';
import Charts from './Charts';

function TransactionDetails({ urlParams }) {
  return (
    <div>
      <Breadcrumbs />
      <PageHeader title={urlParams.transactionName} />
      <Charts />
      <Distribution />
      <Transaction />
    </div>
  );
}

export default TransactionDetails;
