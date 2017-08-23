import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { StatusGroup } from '../status_group';
import { Issues } from './issues';
import { IssueSummary } from './issue_summary';


export function NodeDeprecations({ className, deprecations }) {
  const issueLevelCounts = _.countBy(deprecations, 'level');

  return (
    <StatusGroup
      className={ className }
      isInitiallyCollapsed
      status={ <IssueSummary issueLevelCounts={ issueLevelCounts } /> }
      title="Node Settings"
    >
      { deprecations.length > 0
        ? <Issues issues={ deprecations } />
        : <p className="kuiText kuiSubduedText">No node settings deprecations</p>
      }
    </StatusGroup>
  );
}

NodeDeprecations.propTypes = {
  className: PropTypes.string,
  deprecations: PropTypes.array,
};

NodeDeprecations.defaultProps = {
  className: null,
  deprecations: [],
};
