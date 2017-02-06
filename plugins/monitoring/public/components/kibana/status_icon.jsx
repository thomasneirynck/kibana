import React from 'react';
import { includes } from 'lodash';

export function KibanaStatusIcon({ status, availability = true }) {
  const mappedStatus = (() => {
    const expectedStatuses = ['red', 'yellow', 'green'];
    return includes(expectedStatuses, status) ? status : 'yellow';
  })();

  const { icon, color } = (() => {
    if (!availability) {
      return {
        color: 'gray',
        icon: 'fa-bolt'
      };
    }

    if (mappedStatus === 'green') {
      return {
        color: mappedStatus,
        icon: 'fa-check'
      };
    }

    if (mappedStatus === 'yellow') {
      return {
        color: mappedStatus,
        icon: 'fa-warning'
      };
    }

    return {
      color: 'red',
      icon: 'fa-bolt'
    };
  })();


  return (
    <div className={`monitoring-status-icon monitoring-status-icon--${color}`}>
      <span className={`kuiIcon ${icon}`}></span>
    </div>
  );
}
