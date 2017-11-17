import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import { TRANSACTION_ID } from '../../../../../common/constants';

import { units, px } from '../../../../style/variables';
import { KuiTableHeaderCell, KuiInfoButton } from 'ui_framework/components';
import { Tooltip } from 'pui-react-tooltip';
import { OverlayTrigger } from 'pui-react-overlay-trigger';

import APMTable from '../../../shared/APMTable';
import ListItem from './ListItem';

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
  top: 1px;
  left: ${px(units.half)};
  margin-right: ${px(units.quarter * 3)};
`;

const ImpactToolTip = () => (
  <TooltipWrapper>
    <OverlayTrigger
      placement="top"
      trigger="click"
      overlay={
        <Tooltip>
          Impact shows the most used and slowest endpoints in your app.
        </Tooltip>
      }
    >
      <KuiInfoButton
        onClick={e => {
          // TODO: Remove this handler once issue with pui-react-overlay-trigger has been resolved
          e.stopPropagation();
          return false;
        }}
      />
    </OverlayTrigger>
  </TooltipWrapper>
);

const getRelativeImpact = (impact, impactMin, impactMax) =>
  Math.max((impact - impactMin) / Math.max(impactMax - impactMin, 1) * 100, 1);

class List extends Component {
  render() {
    const {
      appName,
      type,
      items,
      changeTransactionSorting,
      transactionSorting
    } = this.props;

    const renderHead = () => {
      const cells = [
        { key: 'name', label: 'Name' },
        { key: 'avg', label: 'Avg. resp. time' },
        { key: 'p95', label: '95th percentile' },
        { key: 'rpm', label: getTpmLabel(type) }
      ].map(({ key, label }) => (
        <KuiTableHeaderCell
          key={key}
          onSort={() => changeTransactionSorting(key)}
          isSorted={transactionSorting.key === key}
          isSortAscending={!transactionSorting.descending}
        >
          {label}
        </KuiTableHeaderCell>
      ));

      const impactCell = (
        <KuiTableHeaderCell
          key={'impact'}
          onSort={() => changeTransactionSorting('impact')}
          isSorted={transactionSorting.key === 'impact'}
          isSortAscending={!transactionSorting.descending}
        >
          Impact
          <ImpactToolTip />
        </KuiTableHeaderCell>
      );

      return [...cells, impactCell];
    };

    const renderBody = transactions => {
      const impacts = transactions.map(({ impact }) => impact);
      const impactMin = Math.min(...impacts);
      const impactMax = Math.max(...impacts);

      return transactions.map(transaction => {
        return (
          <ListItem
            key={get({ transaction }, TRANSACTION_ID)}
            appName={appName}
            type={type}
            transaction={transaction}
            impact={getRelativeImpact(transaction.impact, impactMin, impactMax)}
          />
        );
      });
    };

    return (
      <APMTable
        searchableFields={['name']}
        items={items}
        emptyMessageHeading="No transactions in the selected time range."
        renderHead={renderHead}
        renderBody={renderBody}
      />
    );
  }
}

function getTpmLabel(type) {
  return type === 'request' ? 'RPM' : 'TPM';
}

export default List;
