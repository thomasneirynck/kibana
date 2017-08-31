import PropTypes from 'prop-types';
import React from 'react';


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
    </div>
  );
}

CheckupInfo.propTypes = {
  className: PropTypes.string,
};

CheckupInfo.defaultProps = {
  className: null,
};
