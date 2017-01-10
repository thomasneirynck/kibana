import React from 'react';
import { capitalize, kebabCase } from 'lodash';
import { statusIconClass } from '../../lib/map_status_classes';
import { formatBytesUsage, formatPercentageUsage } from '../../lib/format_number';

export function ClusterItemContainer(props) {
  // Note: kebabCase takes something like 'My Name' and makes it 'my-name', which is ideal for CSS names
  return (
    <div className="panel panel-product">
      <div
        className={`panel-heading panel-heading--clickable panel-heading-${kebabCase(props.title)}`}
        onClick={() => props.angularChangeUrl(props.url)}
      >
        {props.title}
      </div>
      <div className="panel-body">
        {props.children}
      </div>
    </div>
  );
}

export function StatusContainer(props) {
  const iconClass = statusIconClass(props.status);
  const status = props.status || 'offline';

  return (
    <div className='status-container'>
      <span className={`status status-${status}`}>
        <span className={iconClass} title={`${props.statusPrefix}: ${capitalize(status)}`}></span>
      </span> Status
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
