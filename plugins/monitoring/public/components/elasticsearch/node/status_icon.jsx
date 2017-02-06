import React from 'react';

export function NodeStatusIcon({ status }) {
  const { icon, color } = (() => {
    if (status === 'Online') {
      return {
        color: 'green',
        icon: 'fa-check'
      };
    }
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
