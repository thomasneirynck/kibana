import React from 'react';

import { IndexDeprecations } from './index_deprecations';
import { ClusterDeprecations } from './cluster_deprecations';
import { NodeDeprecations } from './node_deprecations';


export function CheckupOutput({ className, output }) {
  return (
    <div className={ className }>
      <IndexDeprecations
        className="kuiVerticalRhythm"
        deprecations={ output.index_settings }
      />
      <NodeDeprecations
        className="kuiVerticalRhythm"
        deprecations={ output.node_settings }
      />
      <ClusterDeprecations
        className="kuiVerticalRhythm"
        deprecations={ output.cluster_settings }
      />
    </div>
  );
}

CheckupOutput.propTypes = {
  className: React.PropTypes.string,
  output: React.PropTypes.shape({
    cluster_settings: React.PropTypes.array,
    index_settings: React.PropTypes.object,
    node_settings: React.PropTypes.array,
  }),
};

CheckupOutput.defaultProps = {
  className: null,
  output: {},
};
