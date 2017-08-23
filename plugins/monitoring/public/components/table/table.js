import React from 'react';
import { isEqual, sortByOrder, get, includes } from 'lodash';
import { DEFAULT_NO_DATA_MESSAGE } from 'monitoring-constants';
import {
  KuiKeyboardAccessible,
  KuiControlledTable,
  KuiPagerButtonGroup,
  KuiTable,
  KuiTableHeaderCell
} from 'ui_framework/components';
import { MonitoringTableSearchBar } from './search';
import { MonitoringTableNoData } from './no_data';
import { MonitoringTableFooter } from './footer';
import classNames from 'classnames';

/*
 * State and data management for Monitoring Tables
 * - Sort the data
 * - Show the data
 * - Allow the user to change how the data is sorted
 * - Allow the user to filter the data
 * - Allow the user to page through the data
 *
 * Guide to column configuration:
 * const columns = [
 *  {
 *    title: 'Name', // visible title string
 *    sortKey: 'metadata.name', // sording this colunn sorts by the `metadata.name` field in the data
 *    secondarySortOrder: 1, // optional field, makes the column secondarily sorted by default
 *  },
 *  {
 *    title: 'Status', // visible title string
 *    sortKey: 'status', // sording this colunn sorts by the `metadata.name` field in the data
 *    sortOrder: -1, // optional field, makes the column sorted by default
 *  }
 * ];
 */
export class MonitoringTable extends React.Component {
  constructor(props) {
    super(props);

    const defaultSortColumn = props.columns.find(c => c.hasOwnProperty('sortOrder')); // find the col to sort by default
    const sortKey = defaultSortColumn ? defaultSortColumn.sortKey : null;
    const sortOrder = defaultSortColumn ? defaultSortColumn.sortOrder : null;

    const secondarySortColumn = props.columns.find(c => c.hasOwnProperty('secondarySortOrder')); // find the col to sort by default
    const secondarySortKey = secondarySortColumn ? secondarySortColumn.sortKey : null;
    const secondarySortOrder = secondarySortColumn ? secondarySortColumn.secondarySortOrder : null;

    this.state = {
      rows: props.rows,
      sortKey,
      sortOrder,
      secondarySortKey,
      secondarySortOrder,
      filterText: '',
      pageIndex: 1
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const diffProps = !isEqual(nextProps.rows, this.props);
    const diffState = !isEqual(nextState, this.state);
    if (diffProps || diffState) {
      return true;
    }
    return false;
  }

  componentWillReceiveProps({ rows }) {
    this.setState({ rows });
  }

  /*
   * Return true if the row matches the filter value
   * @param {Object} row - Data object for which the table is configured to display
   */
  checkRowFilterMatch(row) {
    const values = this.props.filterFields.map(field => get(row, field)); // find the values of the filterable fields
    return includes(values.join(' ').toLowerCase(), this.state.filterText.toLowerCase());
  }

  /*
   * Return a filtered set of rows that have data that match the filter text
   * @param {Array} rows
   */
  getFilteredRows(rows = []) {
    if (!this.state.filterText) {
      return rows; // filter is cleared, no rows are filtered out
    }
    return rows.filter(row => this.checkRowFilterMatch(row));
  }

  /*
   * Handle UI event of entering text in the Filter text input box
   * @param {Object} event - UI event data
   */
  onFilterChange(value) {
    this.setState({
      filterText: value,
      pageIndex: 1
    });
  }

  /*
   * Determine if the given column has to do with the current state of sorting. If it does, return an icon element
   * @param {Object} col - A column configuration object
   */
  getColumnSortIcon(col) {
    if (col.sortKey !== this.state.sortKey) {
      return;
    }

    const sortDirection = this.state.sortOrder > 0 ? 'up' : 'down'; // ascending = up, descending = down
    return (
      <span data-sort-icon-ascending className={`kuiTableSortIcon kuiIcon fa-long-arrow-${sortDirection}`} />
    );
  }

  /*
   * @param {Number} numVisibleRows - number of visible rows in the current page
   * @param {Number} numAvailableRows - total number of rows in the table
   */
  getPaginationControls(numAvailableRows) {
    if (!numAvailableRows) {
      return null;
    }

    const pageIndex = this.state.pageIndex;
    const numPages = Math.ceil(numAvailableRows / this.props.rowsPerPage);

    const hasPrevious = pageIndex > 1;
    const hasNext = pageIndex < numPages;

    const onPrevious = () => {
      if (hasPrevious) {
        this.setState({ pageIndex: pageIndex - 1 });
      }
    };
    const onNext = () => {
      if (hasNext) {
        this.setState({ pageIndex: pageIndex + 1 });
      }
    };

    return (
      <KuiPagerButtonGroup
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  }

  calculateFirstRow() {
    return (this.state.pageIndex * this.props.rowsPerPage) - this.props.rowsPerPage;
  }

  /*
   * @param {Array} visibleRows - rows of data after they've been filtered and sorted
   * @param {Number} numAvailableRows - number of rows total on all the pages
   */
  getSearchBar(numVisibleRows, numAvailableRows) {
    const firstRow = this.calculateFirstRow();
    return (
      <MonitoringTableSearchBar
        pageIndexFirstRow={numVisibleRows ? firstRow + 1 : 0}
        pageIndexLastRow={numVisibleRows ? numVisibleRows + firstRow : 0}
        rowsFiltered={numAvailableRows}
        placeholder={this.props.placeholder}
        toolBarSections={this.props.toolBarSections}
        paginationControls={this.getPaginationControls(numAvailableRows)}
        onFilterChange={this.onFilterChange.bind(this)}
      />
    );
  }

  /*
   * Update state based on how the user wants to sort/resort data per column sorting
   * Note: secondary sort is not apparent to the user through icons. Secondary
   * sort order is discarded when the user changes the sorting state.
   * @param {Object} col - Column configuration object
   */
  setSortColumn({ sortKey }) {
    // clicking the column that is already sorted reverses the sort order
    if (sortKey === this.state.sortKey) {
      // same column, reverse the sort
      this.setState({ sortOrder: this.state.sortOrder * -1 });
    } else {
      // new column, set to ASC sort
      this.setState({
        sortOrder: 1,
        sortKey
      });
    }
  }

  /*
   * Render the table header cells
   */
  getTableHeader() {
    return this.props.columns.map((col, colIndex) => {
      const headerCellProps = {};
      if (col.headerCellProps) {
        Object.assign(headerCellProps, col.headerCellProps);
      }

      return (
        <KuiTableHeaderCell
          className="kuiTableHeaderCell--sortable"
          key={`kuiTableHeaderCell-${colIndex}`}
          {...headerCellProps}
        >
          <KuiKeyboardAccessible>
            <span onClick={this.setSortColumn.bind(this, col)}>
              { col.title } { this.getColumnSortIcon(col) }
            </span>
          </KuiKeyboardAccessible>
        </KuiTableHeaderCell>
      );
    });
  }

  /*
   * @param {Array} visibleRows - rows of data after they've been filtered and sorted
   * @param {Number} numAvailableRows - number of rows total on all the pages
   */
  getFooter(numVisibleRows, numAvailableRows) {
    const firstRow = this.calculateFirstRow();
    return (
      <MonitoringTableFooter
        pageIndexFirstRow={numVisibleRows ? firstRow + 1 : 0}
        pageIndexLastRow={numVisibleRows ? numVisibleRows + firstRow : 0}
        rowsFiltered={numAvailableRows}
        paginationControls={this.getPaginationControls(numAvailableRows)}
      />
    );
  }

  /*
   * @param {Array} rows - rows of data that need to be sorted
   */
  sortRows(rows = []) {
    if (!this.state.sortKey) {
      return rows;
    }

    const _sortOrder = this.state.sortOrder > 0 ? 'asc' : 'desc';
    let _secondarySortOrder;
    if (this.state.secondarySortOrder) {
      _secondarySortOrder = this.state.secondarySortOrder > 0 ? 'asc' : 'desc';
    }

    return sortByOrder(rows, [this.state.sortKey, this.state.secondarySortKey], [_sortOrder, _secondarySortOrder]);
  }

  /*
   * Filter the rows, sort the rows, get the rows to show for the current page
   * Important: Should be only called from render
   * @param {Array} rows - rows of data for which the table is meant to display
   */
  getVisibleRows(rows = []) {
    // [1] filter the rows
    const filteredRows = this.getFilteredRows(rows);
    const numAvailableRows = filteredRows.length;
    // [2] sort the filtered rows
    const sortedRows = this.sortRows(filteredRows);
    // [3] paginate the sorted filtered rows
    const firstRow = this.calculateFirstRow();
    const visibleRows = sortedRows.slice(firstRow, firstRow + this.props.rowsPerPage);

    return {
      numAvailableRows,
      visibleRows
    };
  }

  render() {
    const classes = classNames(this.props.className, 'monitoringTable');

    let table; // This will come out to either be the KuiTable or a "No Data" message
    const { visibleRows, numAvailableRows } = this.getVisibleRows(this.state.rows);
    const numVisibleRows = visibleRows.length;

    if (numVisibleRows > 0) {
      const RowComponent = this.props.rowComponent;
      const tBody = visibleRows.map((rowData, rowIndex) => {
        return <RowComponent {...rowData} key={`rowData-${rowIndex}`} />;
      });

      table = (
        <KuiTable shrinkToContent={true}>
          <thead>
            <tr>
              { this.getTableHeader() }
            </tr>
          </thead>
          <tbody>
            { tBody }
          </tbody>
        </KuiTable>
      );
    } else {
      table = <MonitoringTableNoData message={this.props.noDataMessage} />;
    }

    return (
      <KuiControlledTable className={classes}>
        { this.getSearchBar(numVisibleRows, numAvailableRows)}
        { table }
        { this.getFooter(numVisibleRows, numAvailableRows) }
      </KuiControlledTable>
    );
  }
}

MonitoringTable.defaultProps = {
  rows: [],
  filterFields: [],
  noDataMessage: DEFAULT_NO_DATA_MESSAGE,
  rowsPerPage: 20
};
