import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import { TRANSACTION_ID } from '../../../../../common/constants';

import { units, px } from '../../../../style/variables';
import {
  KuiTable,
  KuiControlledTable,
  KuiToolBar,
  KuiToolBarSection,
  KuiToolBarSearchBox,
  KuiPager,
  KuiTableHeaderCell,
  KuiTableBody,
  KuiTableHeader,
  KuiInfoButton,
  KuiEmptyTablePromptPanel,
  KuiTableInfo,
  KuiToolBarFooter,
  KuiToolBarFooterSection
} from 'ui_framework/components';
import { Tooltip } from 'pui-react-tooltip';
import { OverlayTrigger } from 'pui-react-overlay-trigger';

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
      <KuiInfoButton />
    </OverlayTrigger>
  </TooltipWrapper>
);

const getRelativeImpact = (impact, impactMin, impactMax) =>
  Math.max((impact - impactMin) / Math.max(impactMax - impactMin, 1) * 100, 1);

class TransactionList extends Component {
  state = { searchQuery: '' };

  onFilter = searchQuery => {
    this.setState({ searchQuery });
  };

  renderPagination(transactions) {
    return (
      <KuiPager
        startNumber={0} // TODO: Change back to variable once pagination is implemented.
        endNumber={transactions.length}
        totalItems={transactions.length}
        hasNextPage={false}
        hasPreviousPage={false}
        onNextPage={() => {}}
        onPreviousPage={() => {}}
      />
    );
  }

  render() {
    const {
      appName,
      list,
      type,
      changeTransactionSorting,
      transactionSorting
    } = this.props;

    const transactions = list.data.filter(item =>
      item.name.toLowerCase().includes(this.state.searchQuery.toLowerCase())
    );

    const impacts = transactions.map(({ impact }) => impact);
    const impactMin = Math.min(...impacts);
    const impactMax = Math.max(...impacts);

    return (
      <KuiControlledTable>
        <KuiToolBar>
          <KuiToolBarSearchBox
            onClick={e => {
              e.stopPropagation();
            }}
            onFilter={this.onFilter}
            placeholder="Filter…"
          />

          <KuiToolBarSection>
            {this.renderPagination(transactions)}
          </KuiToolBarSection>
        </KuiToolBar>

        {transactions.length === 0 && (
          <KuiEmptyTablePromptPanel>
            <KuiTableInfo>No transactions matched your filter.</KuiTableInfo>
          </KuiEmptyTablePromptPanel>
        )}

        {transactions.length > 0 && (
          <KuiTable>
            <KuiTableHeader>
              {[
                { key: 'name', label: 'Name' },
                { key: 'avg', label: 'Avg. resp. time' },
                { key: 'p95', label: '95th percentile' },
                { key: 'rpm', label: 'RPM' }
              ].map(({ key, label }) => (
                <KuiTableHeaderCell
                  key={key}
                  onSort={() => changeTransactionSorting(key)}
                  isSorted={transactionSorting.key === key}
                  isSortAscending={!transactionSorting.descending}
                >
                  {label}
                </KuiTableHeaderCell>
              ))}
              <KuiTableHeaderCell
                onSort={() => changeTransactionSorting('impact')}
                isSorted={transactionSorting.key === 'impact'}
                isSortAscending={!transactionSorting.descending}
              >
                Impact
                <ImpactToolTip />
              </KuiTableHeaderCell>
            </KuiTableHeader>

            <KuiTableBody>
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
            </KuiTableBody>
          </KuiTable>
        )}

        <KuiToolBarFooter>
          <KuiToolBarFooterSection>
            {this.renderPagination(transactions)}
          </KuiToolBarFooterSection>
        </KuiToolBarFooter>
      </KuiControlledTable>
    );
  }
}

export default TransactionList;
