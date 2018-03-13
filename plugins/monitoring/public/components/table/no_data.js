import React from 'react';
import {
  KuiEmptyTablePromptPanel,
  KuiTableInfo
} from '@kbn/ui-framework/components';

export function MonitoringTableNoData({ message }) {
  return (
    <KuiEmptyTablePromptPanel data-test-subj="monitoringTableNoData">
      <KuiTableInfo>
        { message }
      </KuiTableInfo>
    </KuiEmptyTablePromptPanel>
  );
}
