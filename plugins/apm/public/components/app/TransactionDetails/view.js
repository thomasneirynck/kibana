import React from 'react';
import { PageHeader, GraphHeader } from '../../shared/UIComponents';
import Transaction from './Transaction';
import Distribution from './Distribution';
import Charts from './Charts';

function TransactionDetails({ urlParams }) {
  return (
    <div>
      <PageHeader>{urlParams.transactionName}</PageHeader>
      <Charts />
      <GraphHeader>Reponse time distribution</GraphHeader>
      <Distribution />
      <Transaction />
    </div>
  );
}

export default TransactionDetails;
