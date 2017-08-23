import PropTypes from 'prop-types';
import React from 'react';

import { Issues } from './issues';


const INFO_ISSUES = [
  {
    level: 'none',
    message: 'Everything is OK.',
  },
  {
    level: 'info',
    message: 'Info that something has changed. No action required to upgrade.',
  },
  {
    level: 'warning',
    message: (
      'Action recommended but not required to upgrade. You are using '
      + 'deprecated functionality which will not be available in version 6.0.'
    ),
  },
  {
    level: 'critical',
    message: 'Action required. You must fix this problem to upgrade.',
  },
];

export function CheckupInfo({ className }) {
  return (
    <div className={className}>
      <p className="kuiText kuiVerticalRhythm">
        This tool runs a series of checks against your Elasticsearch cluster, nodes, and indices
        to determine whether you can upgrade directly to Elasticsearch version 6, or whether you
        need to make changes to your data before doing so.
      </p>
      <p className="kuiText kuiVerticalRhythm">
        You will also see deprecated cluster settings and node settings, deprecated plugins, and
        indices with deprecated mappings currently in use.
      </p>
      <p className="kuiText kuiVerticalRhythm">
        Each issue found has a degree of severity:
      </p>
      <Issues className="kuiVerticalRhythm" issues={INFO_ISSUES} />
    </div>
  );
}

CheckupInfo.propTypes = {
  className: PropTypes.string,
};

CheckupInfo.defaultProps = {
  className: null,
};
