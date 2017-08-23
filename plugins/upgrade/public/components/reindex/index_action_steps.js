import PropTypes from 'prop-types';
import React from 'react';

import { IndexActionStep } from './index_action_step';


export function IndexActionSteps({ steps, action, indexName }) {
  return (
    <div>
      { steps.map((step, stepIndex) => (
        <IndexActionStep
          key={ stepIndex }
          step={ step }
          action={ action }
          indexName={ indexName }
        />
      )) }
    </div>
  );
}

IndexActionSteps.propTypes = {
  steps: PropTypes.array,
  action: PropTypes.string,
  indexName: PropTypes.string,
};

IndexActionSteps.defaultProps = {
  steps: [],
  action: PropTypes.string,
  indexName: PropTypes.string,
};
