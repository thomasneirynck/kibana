import classNames from 'classnames';
import React from 'react';

import { DEPRECATION_ISSUE_LEVELS } from '../../../../lib/constants';


export function IssueSymbol({ level }) {
  const levelToClassNameMap = {
    none: 'kuiIcon--success fa-check',
    info: 'kuiIcon--info fa-info',
    warning: 'kuiIcon--warning fa-bolt',
    critical: 'kuiIcon--error fa-warning',
  };

  const iconClasses = classNames('kuiIcon', levelToClassNameMap[level]);

  return (
    <span className='kuiEventSymbol'>
      <span className={ iconClasses } />
    </span>
  );
}

IssueSymbol.propTypes = {
  level: React.PropTypes.oneOf(DEPRECATION_ISSUE_LEVELS),
};

IssueSymbol.defaultProps = {
  level: null,
};
