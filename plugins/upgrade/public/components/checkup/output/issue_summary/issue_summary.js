import React from 'react';

import { DEPRECATION_ISSUE_LEVELS } from '../../../../lib/constants';


const ISSUE_LEVEL_MESSAGES = {
  info: (count) => (
    <span className="kuiStatusText kuiStatusText--info">
      <span className="kuiStatusText__icon kuiIcon fa-info" />
      {
        count === 1
        ? <span>{ count } note found</span>
        : <span>{ count } notes found</span>
      }
    </span>
  ),
  warning: (count) => (
    <span className="kuiStatusText kuiStatusText--warning">
      <span className="kuiStatusText__icon kuiIcon fa-bolt" />
      {
        count === 1
        ? <span>{ count } warning found</span>
        : <span>{ count } warnings found</span>
      }
    </span>
  ),
  critical: (count) => (
    <span className="kuiStatusText kuiStatusText--error">
      <span className="kuiStatusText__icon kuiIcon fa-warning" />
      {
        count === 1
        ? <span>{ count } error found</span>
        : <span>{ count } errors found</span>
      }
    </span>
  ),
  none: () => (
    <span className="kuiStatusText kuiStatusText--success">
      <span className="kuiStatusText__icon kuiIcon fa-check" />
      No problems found
    </span>
  ),
};

export function IssueSummary({ className, issueLevelCounts }) {
  const highestIssueLevel = DEPRECATION_ISSUE_LEVELS.reduce((highestLevel, issueLevel) => {
    if (highestLevel !== 'none') {
      return highestLevel;
    }

    if ((issueLevelCounts[issueLevel] || 0) > 0) {
      return issueLevel;
    } else {
      return highestLevel;
    }
  }, 'none');

  return (
    <span className={ className }>
      { ISSUE_LEVEL_MESSAGES[highestIssueLevel](issueLevelCounts[highestIssueLevel]) }
    </span>
  );
}

IssueSummary.propTypes = {
  className: React.PropTypes.string,
  issueLevelCounts: React.PropTypes.object,
};

IssueSummary.defaultProps = {
  className: null,
  issueLevelCounts: {},
};
