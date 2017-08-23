import React from 'react';
import {
  KuiToolBar,
  KuiToolBarSearchBox,
  KuiToolBarSection,
  KuiToolBarText
} from 'ui_framework/components';

export function MonitoringTableSearchBar(props) {
  return (
    <KuiToolBar>
      <KuiToolBarSearchBox
        onFilter={props.onFilterChange}
        placeholder={props.placeholder}
      />

      { props.toolBarSections }

      <KuiToolBarSection>
        <KuiToolBarText>
          { props.pageIndexFirstRow } &ndash; { props.pageIndexLastRow } of { props.rowsFiltered }
        </KuiToolBarText>

        { props.paginationControls }
      </KuiToolBarSection>
    </KuiToolBar>
  );
}
MonitoringTableSearchBar.defaultProps = { toolBarSections: [] };
