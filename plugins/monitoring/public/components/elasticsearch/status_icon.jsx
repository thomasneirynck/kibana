import React from 'react';

export function ElasticsearchStatusIcon({ status }) {
  const { icon, color } = (() => {
    if (status === 'green') {
      return {
        color: status,
        icon: 'fa-check'
      };
    }

    if (status === 'yellow') {
      return {
        color: status,
        icon: 'fa-warning'
      };
    }

    if (status === 'red') {
      return {
        color: status,
        icon: 'fa-bolt'
      };
    }

    // deleted/unknown index
    return {
      color: 'gray',
      icon: 'fa-bolt'
    };
  })();

  return (
    <div className={`monitoring-status-icon monitoring-status-icon--${color}`}>
      <span className={`kuiIcon ${icon}`}></span>
    </div>
  );
}
