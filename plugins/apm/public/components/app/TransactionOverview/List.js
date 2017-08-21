import React from 'react';
import styled from 'styled-components';
import { Table, TableHead, TableLoader } from '../../shared/Table';
import ListItem from './ListItem';
import { colors, borderRadius } from '../../../style/variables';
import { get } from 'lodash';
import { TRANSACTION_ID } from '../../../../common/constants';

const TransactionsContainer = styled.div`
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid ${colors.elementBorder};
  border-radius: ${borderRadius};
`;

function TransactionList({ appName, list, type }) {
  const transactions = list.data || [];

  return (
    <TransactionsContainer>
      <Table>
        <thead>
          <tr>
            <TableHead>Endpoints</TableHead>
            <TableHead>Avg. resp. time</TableHead>
            <TableHead>95th percentile</TableHead>
            <TableHead>RPM</TableHead>
            <TableHead>Impact</TableHead>
          </tr>
        </thead>

        <tbody>
          <TableLoader status={list.status} columns={5} />

          {transactions.map(transaction => {
            return (
              <ListItem
                key={get({ transaction }, TRANSACTION_ID)}
                appName={appName}
                type={type}
                transaction={transaction}
              />
            );
          })}
        </tbody>
      </Table>
    </TransactionsContainer>
  );
}

export default TransactionList;
