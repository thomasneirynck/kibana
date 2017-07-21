import _ from 'lodash';

import {
  NUMBER_OF_STEPS,
  STEP_RESULTS,
} from '../constants';


export function isCompleted(indexState) {
  return indexState.steps.length === NUMBER_OF_STEPS[indexState.action] && _.every(indexState.steps, isStepCompleted);
}

export function isFailed(indexState) {
  return _.some(indexState.steps, isStepFailed);
}

export function isNotStarted(indexState) {
  return _.every(indexState.steps, isStepNotStarted);
}

export function isRunning(indexState) {
  return !isFailed(indexState) && _.some(indexState.steps, isStepRunning);
}

export function isStepCompleted(step) {
  return step.result === STEP_RESULTS.COMPLETED;
}

export function isStepFailed(step) {
  return _.isObject(step.result) && step.result.message;
}

export function isStepNotStarted(step) {
  return step.result === STEP_RESULTS.NOT_STARTED;
}

export function isStepRunning(step) {
  return step.result === STEP_RESULTS.RUNNING;
}

