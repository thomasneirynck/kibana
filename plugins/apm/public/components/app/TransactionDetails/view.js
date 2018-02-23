import React from 'react';
import { HeaderLarge } from '../../shared/UIComponents';
import Transaction from './Transaction';
import Distribution from './Distribution';
import Charts from './Charts';

function TransactionDetails({ urlParams }) {
  return (
    <div>
      <HeaderLarge>{urlParams.transactionName}</HeaderLarge>
      <Charts />
      <Distribution />
      <Transaction />
    </div>
  );
}

export default TransactionDetails;
