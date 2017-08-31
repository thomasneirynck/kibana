import PropTypes from 'prop-types';
import React from 'react';

import { DEPRECATION_ISSUE_LEVELS } from '../../lib/constants';


const ISSUE_LEVEL_MESSAGES = {
  info: (count) => (
    <span className="kuiStatusText kuiStatusText--info">
      <span className="kuiStatusText__icon kuiIcon fa-info" />
      {
        count === 1
        ? <span>{ count } note</span>
        : <span>{ count } notes</span>
      }
    </span>
  ),
  warning: (count) => (
    <span className="kuiStatusText kuiStatusText--warning">
      <span className="kuiStatusText__icon kuiIcon fa-bolt" />
      {
        count === 1
        ? <span>{ count } warning</span>
        : <span>{ count } warnings</span>
      }
    </span>
  ),
  critical: (count) => (
    <span className="kuiStatusText kuiStatusText--error">
      <span className="kuiStatusText__icon kuiIcon fa-warning" />
      {
        count === 1
        ? <span>{ count } error</span>
        : <span>{ count } errors</span>
      }
    </span>
  ),
  none: () => (
    <span className="kuiStatusText kuiStatusText--success">
      <span className="kuiStatusText__icon kuiIcon fa-check" />
      No problems
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
    <span className={className}>
      { ISSUE_LEVEL_MESSAGES[highestIssueLevel](issueLevelCounts[highestIssueLevel]) }
    </span>
  );
}

IssueSummary.propTypes = {
  className: PropTypes.string,
  issueLevelCounts: PropTypes.object,
};

IssueSummary.defaultProps = {
  className: null,
  issueLevelCounts: {},
};
