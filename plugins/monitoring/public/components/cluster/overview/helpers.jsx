import React from 'react';
import { kebabCase } from 'lodash';
import { formatBytesUsage, formatPercentageUsage } from 'plugins/monitoring/lib/format_number';

export function ClusterItemContainer(props) {
  // Note: kebabCase takes something like 'My Name' and makes it 'my-name', which is ideal for CSS names
  return (
    <div className='cluster-panel panel panel-product'>
      <div className={`panel-heading panel-heading-${kebabCase(props.title)}`}>
        {props.title}
      </div>
      <div className='cluster-panel__body panel-body'>
        {props.children}
      </div>
    </div>
  );
}

export function StatusContainer(props) {
  return (
    <div className='cluster-panel__status-icon'>
      {props.children} Status
    </div>
  );
}

export function BytesUsage({ usedBytes, maxBytes }) {
  if (usedBytes && maxBytes) {
    return (
      <span>
        {formatBytesUsage(usedBytes, maxBytes)}
        &nbsp;
        ({formatPercentageUsage(usedBytes, maxBytes)})
      </span>
    );
  }

  return null;
}

export function BytesPercentageUsage({ usedBytes, maxBytes }) {
  if (usedBytes && maxBytes) {
    return (
      <span>
        {formatPercentageUsage(usedBytes, maxBytes)}
        &nbsp;
        ({formatBytesUsage(usedBytes, maxBytes)})
      </span>
    );
  }

  return null;
}
