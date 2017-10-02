import React from 'react';
import styled from 'styled-components';
import { RelativeLink } from '../../../../utils/url';
import { KuiTableRow, KuiTableRowCell } from 'ui_framework/components';
import { px, unit, fontSizes } from '../../../../style/variables';
import { RIGHT_ALIGNMENT } from 'ui_framework/services';
import { getFormattedResponseTime } from '../../../shared/charts/TransactionCharts/utils';
import numeral from '@elastic/numeral';

const AppNameCell = styled(KuiTableRowCell)`max-width: ${px(unit * 2)};`;

const AppLink = styled(RelativeLink)`font-size: ${fontSizes.large};`;

function formatString(value) {
  return value || 'N/A';
}

function formatNumber(value) {
  const formatted = numeral(value).format('0.0');
  return formatted <= 0.1 ? '< 0.1' : formatted;
}

function ListItem({ app }) {
  const {
    appName,
    agentName,
    transactionsPerMinute,
    errorsPerMinute,
    avgResponseTime
  } = app;

  return (
    <KuiTableRow>
      <AppNameCell>
        <AppLink path={`${appName}/transactions`}>
          {formatString(appName)}
        </AppLink>
      </AppNameCell>
      <KuiTableRowCell>{formatString(agentName)}</KuiTableRowCell>
      <KuiTableRowCell align={RIGHT_ALIGNMENT}>
        {getFormattedResponseTime(avgResponseTime / 1000)}
      </KuiTableRowCell>
      <KuiTableRowCell align={RIGHT_ALIGNMENT}>
        {formatNumber(transactionsPerMinute)}
      </KuiTableRowCell>
      <KuiTableRowCell align={RIGHT_ALIGNMENT}>
        {formatNumber(errorsPerMinute)}
      </KuiTableRowCell>
    </KuiTableRow>
  );
}

export default ListItem;
