import _ from 'lodash';
import React from 'react';

import { StatusGroup } from '../status_group';
import { Issues } from './issues';
import { IssueSummary } from './issue_summary';


export function IndexDeprecations({ className, deprecations }) {
  const indexNames = Object.keys(deprecations);
  const levelCountsByIndex = _.reduce(deprecations, (result, levelCounts, indexName) => ({
    ...result,
    [indexName]: _.countBy(levelCounts, 'level'),
  }), {});
  const totalLevelCounts = _.reduce(levelCountsByIndex, (totalCounts, levelCounts) => ({
    none: totalCounts.none + (levelCounts.none || 0),
    info: totalCounts.info + (levelCounts.info || 0),
    warning: totalCounts.warning + (levelCounts.warning || 0),
    critical: totalCounts.critical + (levelCounts.critical || 0),
  }), {
    none: 0,
    info: 0,
    warning: 0,
    critical: 0,
  });

  return (
    <StatusGroup
      className={ className }
      isInitiallyCollapsed
      status={ <IssueSummary issueLevelCounts={ totalLevelCounts } /> }
      title="Index Settings"
    >
      { indexNames.length > 0
        ? (
          indexNames.map((indexName) => (
            <div key={ indexName }>
              <div className="kuiBar">
                <div className="kuiBarSection">
                  <p className='kuiTextTitle'>{ indexName }</p>
                </div>
                <div className="kuiBarSection">
                  <IssueSummary issueLevelCounts={ levelCountsByIndex[indexName] } />
                </div>
              </div>
              <Issues issues={ deprecations[indexName] } />
            </div>
          ))
        )
        : <p className="kuiText kuiSubduedText">No index-level deprecations</p>
      }
    </StatusGroup>
  );
}

IndexDeprecations.propTypes = {
  className: React.PropTypes.string,
  deprecations: React.PropTypes.objectOf(React.PropTypes.array),
};

IndexDeprecations.defaultProps = {
  className: null,
  deprecations: {},
};
