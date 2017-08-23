import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {
  isStepCompleted,
  isStepFailed,
  isStepRunning,
  isStepCanceled,
  getStepMessage,
} from '../../lib';


export function IndexActionStep({ step, action, indexName }) {
  const iconClasses = classNames('kuiStatusText__icon', 'kuiIcon', {
    'kuiIcon--success fa-check': isStepCompleted(step) || isStepCanceled(step),
    'kuiIcon--error fa-warning': isStepFailed(step),
    'kuiIcon--basic fa-spinner fa-spin': isStepRunning(step),
  });

  return (
    <div className="kuiText">
      <div className="kuiStatusText">
        <span className={ iconClasses } />
        { getMessage(step, action, indexName) }
      </div>
    </div>
  );
}

IndexActionStep.propTypes = {
  step: PropTypes.object,
  action: PropTypes.string,
  indexName: PropTypes.string,
};

IndexActionStep.defaultProps = {
  steps: {},
  action: '',
  indexName: '',
};

function getMessage(step, action, indexName) {
  return getStepMessage(action, step.result, step.name, { ...step, indexName });
}
