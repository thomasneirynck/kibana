import React, { Component } from 'react';

import {
  KuiTable,
  KuiControlledTable,
  KuiToolBar,
  KuiToolBarSection,
  KuiToolBarSearchBox,
  KuiPager,
  KuiTableBody,
  KuiTableHeader,
  KuiEmptyTablePromptPanel,
  KuiTableInfo,
  KuiToolBarFooter,
  KuiToolBarFooterSection
} from 'ui_framework/components';

class APMTable extends Component {
  state = { searchQuery: '' };

  onFilter = searchQuery => {
    this.setState({ searchQuery });
  };

  render() {
    const {
      searchableFields = [],
      items = [],
      emptyText,
      renderHead,
      renderBody
    } = this.props;

    const filteredItems = items.filter(item => {
      const isEmpty = this.state.searchQuery === '';
      const isMatch = searchableFields.some(property => {
        return (
          item[property] &&
          item[property]
            .toLowerCase()
            .includes(this.state.searchQuery.toLowerCase())
        );
      });
      return isEmpty || isMatch;
    });

    const Pagination = (
      <KuiPager
        startNumber={0} // TODO: Change back to variable once pagination is implemented.
        endNumber={filteredItems.length}
        totalItems={filteredItems.length}
        hasNextPage={false}
        hasPreviousPage={false}
        onNextPage={() => {}}
        onPreviousPage={() => {}}
      />
    );

    return (
      <KuiControlledTable>
        <KuiToolBar>
          <KuiToolBarSearchBox
            onClick={e => e.stopPropagation()}
            onFilter={this.onFilter}
            placeholder="Filter…"
          />

          <KuiToolBarSection>{Pagination}</KuiToolBarSection>
        </KuiToolBar>

        {filteredItems.length === 0 && (
          <KuiEmptyTablePromptPanel>
            <KuiTableInfo>{emptyText}</KuiTableInfo>
          </KuiEmptyTablePromptPanel>
        )}

        {filteredItems.length > 0 && (
          <KuiTable>
            <KuiTableHeader>{renderHead()}</KuiTableHeader>
            <KuiTableBody>{renderBody(filteredItems)}</KuiTableBody>
          </KuiTable>
        )}

        <KuiToolBarFooter>
          <KuiToolBarFooterSection>{Pagination}</KuiToolBarFooterSection>
        </KuiToolBarFooter>
      </KuiControlledTable>
    );
  }
}

export default APMTable;
