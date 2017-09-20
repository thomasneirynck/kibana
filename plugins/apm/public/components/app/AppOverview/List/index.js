import React, { Component } from 'react';

import { KuiTableHeaderCell } from 'ui_framework/components';
import APMTable from '../../../shared/APMTable';
import ListItem from './ListItem';

class List extends Component {
  render() {
    const { items, changeAppSorting, appSorting } = this.props;

    const renderHead = () => {
      const cells = [
        { key: 'appName', label: 'Name' },
        { key: 'overallAvg', label: 'Avg. response time' }
      ].map(({ key, label }) => (
        <KuiTableHeaderCell
          key={key}
          onSort={() => changeAppSorting(key)}
          isSorted={appSorting.key === key}
          isSortAscending={!appSorting.descending}
        >
          {label}
        </KuiTableHeaderCell>
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
        searchableFields={['appName']}
        items={items}
        emptyText="No apps matched your filter. "
        renderHead={renderHead}
        renderBody={renderBody}
      />
    );
  }
}

export default List;
