import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { toQuery, fromQuery } from '../../../../utils/url';
import { debounce } from 'lodash';
import APMTable, {
  AlignmentKuiTableHeaderCell
} from '../../../shared/APMTable/APMTable';
import ListItem from './ListItem';

const ITEMS_PER_PAGE = 20;
class List extends Component {
  updateQuery = getNextQuery => {
    const { location, history } = this.props;
    const prevQuery = toQuery(location.search);

    history.push({
      ...location,
      search: fromQuery(getNextQuery(prevQuery))
    });
  };

  onClickNext = () => {
    this.updateQuery(prevQuery => ({
      ...prevQuery,
      page: prevQuery.page + 1
    }));
  };

  onClickPrev = () => {
    this.updateQuery(prevQuery => ({
      ...prevQuery,
      page: prevQuery.page - 1
    }));
  };

  onFilter = debounce(q => {
    this.updateQuery(prevQuery => ({
      ...prevQuery,
      page: 0,
      q
    }));
  }, 300);

  onSort = key => {
    this.updateQuery(prevQuery => ({
      ...prevQuery,
      sortBy: key,
      sortOrder: this.props.urlParams.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  render() {
    const { items } = this.props;
    const {
      sortBy = 'latestOccurrenceAt',
      sortOrder,
      page,
      serviceName
    } = this.props.urlParams;

    const renderHead = () => {
      const cells = [
        { key: 'groupId', sortable: false, label: 'Group ID' },
        { key: 'message', sortable: false, label: 'Error message and culprit' },
        {
          key: 'occurrenceCount',
          sortable: true,
          label: 'Group occurrences',
          alignRight: true
        },
        {
          key: 'latestOccurrenceAt',
          sortable: true,
          label: 'Latest occurrence',
          alignRight: true
        }
      ].map(({ key, sortable, label, alignRight }) => (
        <AlignmentKuiTableHeaderCell
          key={key}
          className={alignRight ? 'kuiTableHeaderCell--alignRight' : ''}
          onSort={() => sortable && this.onSort(key)}
          isSorted={sortBy === key}
          isSortAscending={sortOrder === 'asc'}
        >
          {label}
        </AlignmentKuiTableHeaderCell>
      ));

      return cells;
    };

    const renderBody = errorGroups => {
      return errorGroups.map(error => {
        return (
          <ListItem
            key={error.groupId}
            serviceName={serviceName}
            error={error}
          />
        );
      });
    };

    return (
      <APMTable
        defaultSearchQuery={this.props.urlParams.q}
        emptyMessageHeading="No errors in the selected time range."
        items={items}
        itemsPerPage={ITEMS_PER_PAGE}
        onClickNext={this.onClickNext}
        onClickPrev={this.onClickPrev}
        onFilter={this.onFilter}
        page={page}
        renderBody={renderBody}
        renderHead={renderHead}
        totalItems={items.length}
      />
    );
  }
}

export default withRouter(List);
