import React from 'react';
import styled from 'styled-components';
import { RelativeLink } from '../../../../utils/url';
import { KuiTableRow, KuiTableRowCell } from 'ui_framework/components';
import { px, unit, fontSizes } from '../../../../style/variables';
import { RIGHT_ALIGNMENT } from 'ui_framework/services';
import { asMillisWithDefault } from '../../../../utils/formatters';
import numeral from '@elastic/numeral';

const ServiceNameCell = styled(KuiTableRowCell)`
  max-width: ${px(unit * 2)};
`;

const AppLink = styled(RelativeLink)`
  font-size: ${fontSizes.large};
`;

function formatString(value) {
  return value || 'N/A';
}

function formatNumber(value) {
  const formatted = numeral(value).format('0.0');
  return formatted <= 0.1 ? '< 0.1' : formatted;
}

function ListItem({ service }) {
  const {
    serviceName,
    agentName,
    transactionsPerMinute,
    errorsPerMinute,
    avgResponseTime
  } = service;

  return (
    <KuiTableRow>
      <ServiceNameCell>
        <AppLink path={`${serviceName}/transactions`}>
          {formatString(serviceName)}
        </AppLink>
      </ServiceNameCell>
      <KuiTableRowCell>{formatString(agentName)}</KuiTableRowCell>
      <KuiTableRowCell align={RIGHT_ALIGNMENT}>
        {asMillisWithDefault(avgResponseTime)}
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
