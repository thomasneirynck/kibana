import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { StatusGroup } from '../status_group';
import { Issues } from './issues';
import { IssueSummary } from './issue_summary';


export function ClusterDeprecations({ className, deprecations }) {
  const issueLevelCounts = _.countBy(deprecations, 'level');

  return (
    <StatusGroup
      className={className}
      isInitiallyCollapsed
      status={<IssueSummary issueLevelCounts={issueLevelCounts} />}
      title="Cluster Settings"
    >
      { deprecations.length > 0
        ? <Issues issues={deprecations} />
        : <p className="kuiText kuiSubduedText">No cluster settings deprecations</p>
      }
    </StatusGroup>
  );
}

ClusterDeprecations.propTypes = {
  className: PropTypes.string,
  deprecations: PropTypes.array,
};

ClusterDeprecations.defaultProps = {
  className: null,
  deprecations: [],
};
