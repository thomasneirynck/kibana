import { get } from 'lodash';
import React from 'react';
import { formatNumber } from '../../../lib/format_number';
import { OfflineCell } from './offline_cell';

function formatMetric(metric, key) {
  const meta = metric.metric;
  const value = get(metric, key);
  if (!meta.format) { return value; }

  if (!!value || value === 0) {
    return formatNumber(value, meta.format) + ' ' + meta.units;
  }

  // N/A would show if the API returned no data at all, since the API filters out null from the data
  return 'N/A';

}

function slopeArrow(metric) {
  if (metric.slope > 0) {
    return 'up';
  }
  return 'down';
}

export function MetricCell(props) {
  if (props.isOnline) {
    return (
      <td>
        <div className='big inline'>
          { formatMetric(props.metric, 'last') }
        </div>
        <span className={ `big inline fa fa-long-arrow-${slopeArrow(props.metric)}` }></span>
        <div className='inline'>
          <div className='small'>
            { formatMetric(props.metric, 'max') } max
          </div>
          <div className='small'>
            { formatMetric(props.metric, 'min') } min
          </div>
        </div>
      </td>
    );
  }

  return <OfflineCell/>;
};
