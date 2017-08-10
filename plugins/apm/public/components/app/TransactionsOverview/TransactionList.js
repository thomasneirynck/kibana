import React from 'react';
import TransactionLoader from './TransactionLoader';
import TransactionListItem from './TransactionListItem';
import styled from 'styled-components';
import { units, px, colors, borderRadius } from '../../../style/variables';
import { get } from 'lodash';
import { TRANSACTION_ID } from '../../../../common/constants';

const TransactionsContainer = styled.div`
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid ${colors.elementBorder};
  border-radius: ${borderRadius};
`;

const Table = styled.table`width: 100%;`;

const TableHeading = styled.th`
  text-align: right;
  border-bottom: 1px solid ${colors.elementBorder};
  border-left: 1px solid ${colors.tableBorder};
  padding: ${px(units.minus)};
  position: relative;
  cursor: pointer;

  &:first-child {
    border-left: 0;
    text-align: left;
  }
`;

function TransactionList({ appName, list, type }) {
  const transactions = list.data || [];

  return (
    <TransactionsContainer>
      <Table>
        <thead>
          <tr>
            <TableHeading>Endpoints</TableHeading>
            <TableHeading>Avg. resp. time</TableHeading>
            <TableHeading>95th percentile</TableHeading>
            <TableHeading>RPM</TableHeading>
            <TableHeading>Impact</TableHeading>
          </tr>
        </thead>

        <tbody>
          <TransactionLoader status={list.status} />

          {transactions.map(transaction => {
            return (
              <TransactionListItem
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
