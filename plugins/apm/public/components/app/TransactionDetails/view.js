import React from 'react';
import PageHeader from '../../shared/PageHeader';
import WiremockContainer from '../../shared/WiremockContainer';
import Transaction from './Transaction';
import Breadcrumbs from '../../shared/Breadcrumbs';
import Distribution from './Distribution';

function TransactionDetails({ urlParams }) {
  return (
    <div>
      <Breadcrumbs />
      <PageHeader title={urlParams.transactionName} />
      <WiremockContainer />
      <Distribution />
      <Transaction />
    </div>
  );
}

export default TransactionDetails;
