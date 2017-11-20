import React, { Component } from 'react';

import APMTable, {
  AlignmentKuiTableHeaderCell
} from '../../../shared/APMTable';
import ListItem from './ListItem';

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
        emptyMessageHeading="No errors in the selected time range."
        resultsLimitOrder="latest occurrence in group"
        renderHead={renderHead}
        renderBody={renderBody}
      />
    );
  }
}

export default List;
