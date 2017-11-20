import React, { Component } from 'react';
import styled from 'styled-components';

import {
  KuiTable,
  KuiControlledTable,
  KuiToolBar,
  KuiToolBarSearchBox,
  KuiTableBody,
  KuiTableHeader,
  KuiTableHeaderCell,
  KuiEmptyTablePromptPanel,
  KuiToolBarFooter,
  KuiToolBarFooterSection
} from 'ui_framework/components';
import { colors, fontSizes } from '../../../style/variables';

import EmptyMessage from '../EmptyMessage';

export const AlignmentKuiTableHeaderCell = styled(KuiTableHeaderCell)`
  &.kuiTableHeaderCell--alignRight > button > span {
    justify-content: flex-end;
  }
`; // Fixes alignment for sortable KuiTableHeaderCell children

const ResultsLimitMessage = styled.div`
  font-size: ${fontSizes.small};
  color: ${colors.gray3};
`;

class APMTable extends Component {
  state = { searchQuery: '' };

  onFilter = searchQuery => {
    this.setState({ searchQuery });
  };

  render() {
    const {
      searchableFields = [],
      items = [],
      resultsLimit = 100,
      resultsLimitOrder = '',
      emptyMessageHeading,
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

    const ConditionalFooter = () => {
      if (items.length !== resultsLimit) {
        return null;
      }

      return (
        <KuiToolBarFooter>
          <KuiToolBarFooterSection>
            <ResultsLimitMessage>
              Showing first {items.length} results{resultsLimitOrder &&
                ', ordered by ' + resultsLimitOrder}
            </ResultsLimitMessage>
          </KuiToolBarFooterSection>
          <KuiToolBarFooterSection />
        </KuiToolBarFooter>
      );
    };

    return (
      <KuiControlledTable>
        <KuiToolBar>
          <KuiToolBarSearchBox
            onClick={e => e.stopPropagation()}
            onFilter={this.onFilter}
            placeholder="Filter…"
          />
        </KuiToolBar>

        {filteredItems.length === 0 && (
          <KuiEmptyTablePromptPanel>
            <EmptyMessage heading={emptyMessageHeading} />
          </KuiEmptyTablePromptPanel>
        )}

        {filteredItems.length > 0 && (
          <KuiTable>
            <KuiTableHeader>{renderHead()}</KuiTableHeader>
            <KuiTableBody>{renderBody(filteredItems)}</KuiTableBody>
          </KuiTable>
        )}

        <ConditionalFooter />
      </KuiControlledTable>
    );
  }
}

export default APMTable;
