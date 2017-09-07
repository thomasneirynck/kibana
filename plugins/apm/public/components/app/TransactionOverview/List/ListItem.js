import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  borderRadius,
  px,
  colors,
  fontFamilyCode
} from '../../../../style/variables';
import { RelativeLink, legacyEncodeURIComponent } from '../../../../utils/url';
import numeral from '@elastic/numeral';
import { get } from 'lodash';
import { TRANSACTION_NAME } from '../../../../../common/constants';

const TransactionRow = styled.tr`
  border-bottom: 1px solid ${colors.tableBorder};

  &:last-of-type {
    border-bottom: 0;
  }
`;

const TableCell = styled.td`padding: ${px(units.half)} ${px(unit)};`;

const TransactionName = TableCell.extend`font-family: ${fontFamilyCode};`;

const TransactionAvg = TableCell.extend`min-width: ${px(unit * 6)};`;
const TransactionP95 = TableCell.extend`min-width: ${px(unit * 6)};`;

const ImpactBarBackground = styled.div`
  height: ${px(units.minus)};
  border-radius: ${borderRadius};
  background: ${colors.impactBarBackground};
`;

const ImpactBar = styled.div`
  height: ${px(units.minus)};
  width: ${props => props.barWidth}%;
  background: ${colors.impactBar};
  border-radius: ${borderRadius};
`;

function getTransactionDuration(duration) {
  if (!duration) {
    return `N/A`;
  }

  const durationInMilliseconds = duration / 1000;
  const formattedDuration = numeral(durationInMilliseconds).format('0,0');
  return `${formattedDuration} ms`;
}

function getTransactionRpm(rpm) {
  if (!rpm) {
    return `N/A`;
  }

  const transactionRpm = rpm > 0.1 ? numeral(rpm).format('0.0') : '< 0.1';
  return `${transactionRpm} rpm`;
}

function ImpactSparkline({ impact }) {
  if (!impact && impact !== 0) {
    return <div>N/A</div>;
  }

  return (
    <ImpactBarBackground>
      <ImpactBar barWidth={impact} />
    </ImpactBarBackground>
  );
}

function TransactionListItem({ appName, transaction, type, impact }) {
  const transactionName = get({ transaction }, TRANSACTION_NAME);
  const transactionUrl = `${appName}/transactions/${encodeURIComponent(
    type
  )}/${legacyEncodeURIComponent(transactionName)}`;

  return (
    <TransactionRow>
      <TransactionName>
        <RelativeLink path={transactionUrl}>
          {transactionName || 'N/A'}
        </RelativeLink>
      </TransactionName>
      <TransactionAvg>{getTransactionDuration(transaction.avg)}</TransactionAvg>
      <TransactionP95>{getTransactionDuration(transaction.p95)}</TransactionP95>
      <TableCell>{getTransactionRpm(transaction.rpm)}</TableCell>
      <TableCell>
        <ImpactSparkline impact={impact} />
      </TableCell>
    </TransactionRow>
  );
}

export default TransactionListItem;
