import React, { Component } from 'react';

import { get } from 'lodash';
import { TRANSACTION_ID } from '../../../../../common/constants';

import { KuiTableHeaderCell } from 'ui_framework/components';

import SearchableAPMTable from '../../../shared/APMTable/SearchableAPMTable';
import ListItem from './ListItem';
import { tpmUnit } from '../../../../utils/formatters';
import ImpactTooltip from './ImpactTooltip';

const getRelativeImpact = (impact, impactMin, impactMax) =>
  Math.max((impact - impactMin) / Math.max(impactMax - impactMin, 1) * 100, 1);

class List extends Component {
  render() {
    const {
      serviceName,
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
        { key: 'rpm', label: tpmUnit(type).toUpperCase() }
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
          <ImpactTooltip />
        </KuiTableHeaderCell>
      );

      return [...cells, impactCell];
    };

    const impacts = items.map(({ impact }) => impact);
    const impactMin = Math.min(...impacts);
    const impactMax = Math.max(...impacts);

    const renderBody = transactions => {
      return transactions.map(transaction => {
        return (
          <ListItem
            key={get({ transaction }, TRANSACTION_ID)}
            serviceName={serviceName}
            type={type}
            transaction={transaction}
            impact={getRelativeImpact(transaction.impact, impactMin, impactMax)}
          />
        );
      });
    };

    const renderFooterText = () => {
      return items.length === 500
        ? 'Showing first 500 results ordered by response time'
        : '';
    };

    return (
      <SearchableAPMTable
        searchableFields={['name']}
        items={items}
        emptyMessageHeading="No transactions in the selected time range."
        renderHead={renderHead}
        renderBody={renderBody}
        renderFooterText={renderFooterText}
      />
    );
  }
}

export default List;
