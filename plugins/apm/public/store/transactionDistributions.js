import _ from 'lodash';
import * as rest from '../services/rest';
import {
  getKey,
  createActionTypes,
  createAction,
  createReducer
} from './apiHelpers';

const actionTypes = createActionTypes('TRANSACTION_DISTRIBUTION');
export const [
  TRANSACTION_DISTRIBUTION_LOADING,
  TRANSACTION_DISTRIBUTION_SUCCESS,
  TRANSACTION_DISTRIBUTION_FAILURE
] = actionTypes;

const INITIAL_STATE = { data: { buckets: [] } };
const distribution = createReducer(actionTypes, INITIAL_STATE);

const transactionDistributions = (state = {}, action) => {
  if (!actionTypes.includes(action.type)) {
    return state;
  }

  return {
    ...state,
    [action.key]: distribution(state[action.key], action)
  };
};

export const loadTransactionDistribution = createAction(
  actionTypes,
  rest.loadTransactionDistribution
);

export function getTransactionDistribution(state) {
  const { appName, start, end, transactionName } = state.urlParams;
  const key = getKey({ appName, start, end, transactionName });
  return state.transactionDistributions[key] || INITIAL_STATE;
}

export function getDefaultBucketIndex(state) {
  const _distribution = getTransactionDistribution(state);
  return _distribution.data.defaultBucketIndex;
}

export function getDefaultTransactionId(state) {
  const _distribution = getTransactionDistribution(state);
  const bucketIndex =
    state.urlParams.bucket !== undefined
      ? state.urlParams.bucket
      : _distribution.data.defaultBucketIndex;
  return _.get(_distribution.data.buckets[bucketIndex], 'transactionId');
}

export default transactionDistributions;
