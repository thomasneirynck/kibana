import React from 'react';
import { get } from 'lodash';
import { formatMetric } from '../../../lib/format_number';
import { KuiTableRowCell } from '@kbn/ui-framework/components';

function OfflineCell() {
  return (
    <KuiTableRowCell>
      <div className="monitoringTableCell__number monitoringTableCell__offline">
        N/A
      </div>
    </KuiTableRowCell>
  );
}

const getSlopeArrow = (slope) => {
  if (slope || slope === 0) {
    return slope > 0 ? 'up' : 'down';
  }
  return null;
};

function MetricCell({ isOnline, metric = {} }) {
  const { lastVal, maxVal, minVal, slope } = get(metric, 'summary', {});
  const format = get(metric, 'metric.format');
  if (isOnline) {
    return (
      <KuiTableRowCell>
        <div className="monitoringTableCell__MetricCell__metric">
          { formatMetric(lastVal, format, '%') }
        </div>
        <span className={`monitoringTableCell__MetricCell__slopeArrow fa fa-long-arrow-${getSlopeArrow(slope)}`} />
        <div className="monitoringTableCell__MetricCell__minMax">
          <div>
            { formatMetric(maxVal, format, '% max') }
          </div>
          <div>
            { formatMetric(minVal, format, '% min') }
          </div>
        </div>
      </KuiTableRowCell>
    );
  }

  return <OfflineCell/>;
}

export {
  OfflineCell,
  MetricCell
};
