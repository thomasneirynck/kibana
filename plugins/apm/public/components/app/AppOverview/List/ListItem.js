import React from 'react';
import styled from 'styled-components';
import { RelativeLink } from '../../../../utils/url';
import { KuiTableRow, KuiTableRowCell } from 'ui_framework/components';
import { fontSizes } from '../../../../style/variables';
import { getFormattedResponseTime } from '../../../shared/charts/TransactionCharts/utils';

const AppLink = styled(RelativeLink)`font-size: ${fontSizes.large};`;

function ListItem({ app }) {
  const { appName, overallAvg } = app;

  return (
    <KuiTableRow>
      <KuiTableRowCell>
        <AppLink path={`${appName}/transactions`}>{appName || 'N/A'}</AppLink>
      </KuiTableRowCell>
      <KuiTableRowCell>
        {getFormattedResponseTime(overallAvg / 1000)}
      </KuiTableRowCell>
    </KuiTableRow>
  );
}

export default ListItem;
