import React from 'react';
import {
  KuiToolBarFooter,
  KuiToolBarFooterSection,
  KuiToolBarText
} from '@kbn/ui-framework/components';

export function MonitoringTableFooter({ pageIndexFirstRow, pageIndexLastRow, rowsFiltered, paginationControls }) {
  return (
    <KuiToolBarFooter>
      <KuiToolBarFooterSection>
        <KuiToolBarText>
          { pageIndexFirstRow } &ndash; { pageIndexLastRow } of { rowsFiltered }
        </KuiToolBarText>

        { paginationControls }
      </KuiToolBarFooterSection>
    </KuiToolBarFooter>
  );
}
