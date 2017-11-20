import React, { Component } from 'react';

import APMTable, {
  AlignmentKuiTableHeaderCell
} from '../../../shared/APMTable';

import ListItem from './ListItem';

class List extends Component {
  render() {
    const { items, changeAppSorting, appSorting } = this.props;

    const renderHead = () => {
      const cells = [
        { key: 'appName', label: 'Name' },
        { key: 'agentName', label: 'Agent' },
        {
          key: 'avgResponseTime',
          label: 'Avg. response time',
          alignRight: true
        },
        {
          key: 'transactionsPerMinute',
          label: 'Transactions / min.',
          alignRight: true
        },
        { key: 'errorsPerMinute', label: 'Errors  / min.', alignRight: true }
      ].map(({ key, label, alignRight }) => (
        <AlignmentKuiTableHeaderCell
          key={key}
          onSort={() => changeAppSorting(key)}
          isSorted={appSorting.key === key}
          isSortAscending={!appSorting.descending}
          className={alignRight ? 'kuiTableHeaderCell--alignRight' : ''}
        >
          {label}
        </AlignmentKuiTableHeaderCell>
      ));

      return cells;
    };

    const renderBody = apps => {
      return apps.map(app => {
        return <ListItem key={app.appName} app={app} />;
      });
    };

    return (
      <APMTable
        resultsLimit={500}
        searchableFields={['appName', 'agentName']}
        items={items}
        emptyMessageHeading="No apps with data in the selected time range."
        renderHead={renderHead}
        renderBody={renderBody}
      />
    );
  }
}

export default List;
