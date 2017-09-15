import React, { Component } from 'react';
import styled from 'styled-components';

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
  KuiEmptyTablePromptPanel,
  KuiTableInfo,
  KuiToolBarFooter,
  KuiToolBarFooterSection
} from 'ui_framework/components';

const AlignmentKuiTableHeaderCell = styled(KuiTableHeaderCell)`
  &.kuiTableHeaderCell--alignRight > button > span {
    justify-content: flex-end;
  }
`; // Fixes alignment for sortable KuiTableHeaderCell children

import ListItem from './ListItem';

class List extends Component {
  state = { searchQuery: '' };

  onFilter = searchQuery => {
    this.setState({ searchQuery });
  };

  renderPagination(errorGroups) {
    return (
      <KuiPager
        startNumber={0} // TODO: Change back to variable once pagination is implemented.
        endNumber={errorGroups.length}
        totalItems={errorGroups.length}
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
      changeErrorGroupSorting,
      errorGroupSorting
    } = this.props;

    const errorGroups = list.data.filter(item => {
      const isEmpty = this.state.searchQuery === '';
      const isMatch = ['groupId', 'culprit', 'message'].some(property => {
        return (
          item[property] &&
          item[property]
            .toLowerCase()
            .includes(this.state.searchQuery.toLowerCase())
        );
      });
      return isEmpty || isMatch;
    });

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
            {this.renderPagination(errorGroups)}
          </KuiToolBarSection>
        </KuiToolBar>

        {errorGroups.length === 0 && (
          <KuiEmptyTablePromptPanel>
            <KuiTableInfo>No error groups matched your filter.</KuiTableInfo>
          </KuiEmptyTablePromptPanel>
        )}

        {errorGroups.length > 0 && (
          <KuiTable>
            <KuiTableHeader>
              {[
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
              ))}
            </KuiTableHeader>

            <KuiTableBody>
              {errorGroups.map(error => {
                return (
                  <ListItem
                    key={error.groupId}
                    appName={appName}
                    error={error}
                  />
                );
              })}
            </KuiTableBody>
          </KuiTable>
        )}

        <KuiToolBarFooter>
          <KuiToolBarFooterSection>
            {this.renderPagination(errorGroups)}
          </KuiToolBarFooterSection>
        </KuiToolBarFooter>
      </KuiControlledTable>
    );
  }
}

export default List;
