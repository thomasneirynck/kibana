import React from 'react';
import PageHeader from '../../shared/PageHeader/container';
import WiremockContainer from '../../shared/WiremockContainer';
import Transaction from './Transaction/container';
import Breadcrumbs from '../../shared/Breadcrumbs/container';
import Distribution from './Distribution/container';

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
