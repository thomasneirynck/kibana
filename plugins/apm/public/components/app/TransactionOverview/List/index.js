import React from 'react';
import styled from 'styled-components';
import { Table, TableHead, TableLoader } from '../../../shared/Table';
import ListItem from './ListItem';

import { units, px, colors, borderRadius } from '../../../../style/variables';
import { get } from 'lodash';
import { TRANSACTION_ID } from '../../../../../common/constants';
import { KuiInfoButton } from 'ui_framework/components';
import { Tooltip } from 'pui-react-tooltip';
import { OverlayTrigger } from 'pui-react-overlay-trigger';

const TransactionsContainer = styled.div`
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid ${colors.elementBorder};
  border-radius: ${borderRadius};
`;

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
  top: 1px;
  left: ${px(units.half)};
`;

const ImpactToolTip = () => (
  <Wrapper>
    <OverlayTrigger
      placement="top"
      trigger="click"
      overlay={
        <Tooltip>
          Impact shows the most used and slowest endpoints in your app.
        </Tooltip>
      }
    >
      <KuiInfoButton />
    </OverlayTrigger>
  </Wrapper>
);

const getRelativeImpact = (impact, impactMin, impactMax) =>
  Math.max((impact - impactMin) / Math.max(impactMax - impactMin, 1) * 100, 1);

function TransactionList({
  appName,
  list,
  type,
  changeTransactionSorting,
  transactionSorting
}) {
  const transactions = list.data;

  const impacts = transactions.map(({ impact }) => impact);
  const impactMin = Math.min(...impacts);
  const impactMax = Math.max(...impacts);

  return (
    <TransactionsContainer>
      <Table>
        <thead>
          <tr>
            {[
              { key: 'name', label: 'Name' },
              { key: 'avg', label: 'Avg. resp. time' },
              { key: 'p95', label: '95th percentile' },
              { key: 'rpm', label: 'RPM' }
            ].map(({ key, label }) => (
              <TableHead
                key={key}
                onClick={() => changeTransactionSorting(key)}
                selected={transactionSorting.key === key}
                descending={transactionSorting.descending}
              >
                {label}
              </TableHead>
            ))}

            <TableHead
              onClick={() => changeTransactionSorting('impact')}
              selected={transactionSorting.key === 'impact'}
              descending={transactionSorting.descending}
            >
              Impact
              <ImpactToolTip />
            </TableHead>
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
                impact={getRelativeImpact(
                  transaction.impact,
                  impactMin,
                  impactMax
                )}
              />
            );
          })}
        </tbody>
      </Table>
    </TransactionsContainer>
  );
}

export default TransactionList;
