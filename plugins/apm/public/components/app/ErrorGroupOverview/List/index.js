import React, { Component } from 'react';
import styled from 'styled-components';

import APMTable from '../../../shared/APMTable';
import ListItem from './ListItem';

import { KuiTableHeaderCell } from 'ui_framework/components';
const AlignmentKuiTableHeaderCell = styled(KuiTableHeaderCell)`
  &.kuiTableHeaderCell--alignRight > button > span {
    justify-content: flex-end;
  }
`; // Fixes alignment for sortable KuiTableHeaderCell children

class List extends Component {
  render() {
    const {
      appName,
      items,
      changeErrorGroupSorting,
      errorGroupSorting
    } = this.props;

    const renderHead = () => {
      const cells = [
        { key: 'groupId', label: 'Group ID' },
        { key: 'message', label: 'Error message and culprit' },
        {
          key: 'occurrenceCount',
          label: 'Group occurrences',
          alignRight: true
        },
        {
          key: 'latestOccurrenceAt',
          label: 'Latest occurrence',
          alignRight: true
        }
      ].map(({ key, label, alignRight }) => (
        <AlignmentKuiTableHeaderCell
          key={key}
          className={alignRight ? 'kuiTableHeaderCell--alignRight' : ''}
          onSort={() => changeErrorGroupSorting(key)}
          isSorted={errorGroupSorting.key === key}
          isSortAscending={!errorGroupSorting.descending}
        >
          {label}
        </AlignmentKuiTableHeaderCell>
      ));

      return cells;
    };

    const renderBody = errorGroups => {
      return errorGroups.map(error => {
        return <ListItem key={error.groupId} appName={appName} error={error} />;
      });
    };

    return (
      <APMTable
        searchableFields={['groupId', 'culprit', 'message']}
        items={items}
        emptyText="No error groups matched your filter."
        renderHead={renderHead}
        renderBody={renderBody}
      />
    );
  }
}

export default List;
