import classNames from 'classnames';
import React from 'react';

import { Issue } from './issue';


export function Issues({ className, issues }) {
  const classes = classNames('kuiMenu kuiMenu--contained', className);

  return (
    <ul className={ classes }>
      { issues.map((issue, issueIndex) => (
        <Issue
          details={ issue.details }
          key={ issueIndex }
          level={ issue.level }
          message={ issue.message }
          url={ issue.url }
        />
      )) }
    </ul>
  );
}

Issues.propTypes = {
  className: React.PropTypes.string,
  issues: React.PropTypes.array,
};

Issues.defaultProps = {
  className: null,
  issues: [],
};
