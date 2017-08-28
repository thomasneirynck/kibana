import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  colors,
  fontFamilyCode
} from '../../../style/variables';
import { RelativeLink, legacyEncodeURIComponent } from '../../../utils/url';
import numeral from '@elastic/numeral';
import { get } from 'lodash';
import { TRANSACTION_NAME } from '../../../../common/constants';

export const TransactionRow = styled.tr`
  &:nth-child(odd) {
    background: ${colors.elementBackgroundDark};
  }
`;

const TableCell = styled.td`
  text-align: right;
  padding: ${px(units.half)} ${px(units.minus)};
  border-left: 1px solid ${colors.tableBorder};

  &:first-child {
    text-align: left;
    border-left: 0;
  }
`;

const TransactionName = TableCell.extend`
  min-width: ${px(unit * 22)};
  font-family: ${fontFamilyCode};
  font-weight: bold;
`;

const TransactionAvg = TableCell.extend`min-width: ${px(unit * 6)};`;
const TransactionP95 = TableCell.extend`min-width: ${px(unit * 6)};`;

function getTransactionRpm(rpm) {
  if (!rpm) {
    return `N/A`;
  }

  const transactionRpm = rpm > 0.1 ? numeral(rpm).format('0.0') : '< 0.1';
  return `${transactionRpm} rpm`;
}

function TransactionListItem({ appName, transaction, type }) {
  const transactionName = get({ transaction }, TRANSACTION_NAME);
  return (
    <TransactionRow>
      <TransactionName>
        <RelativeLink
          path={`${appName}/transactions/${encodeURIComponent(
            type
          )}/${legacyEncodeURIComponent(transactionName)}`}
        >
          {transactionName || 'N/A'}
        </RelativeLink>
      </TransactionName>
      <TransactionAvg>
        {numeral(transaction.avg).format('0,0')} ms
      </TransactionAvg>
      <TransactionP95>
        {numeral(transaction.p95).format('0,0')} ms
      </TransactionP95>
      <TableCell>{getTransactionRpm(transaction.rpm)}</TableCell>
      <TableCell>{transaction.impact}</TableCell>
    </TransactionRow>
  );
}

export default TransactionListItem;
