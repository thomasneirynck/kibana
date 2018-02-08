import * as rest from '../services/rest';
import { createActionTypes, createAction, createReducer } from './apiHelpers';

const actionTypes = createActionTypes('ERROR_DISTRIBUTION');
export const [
  ERROR_DISTRIBUTION_LOADING,
  ERROR_DISTRIBUTION_SUCCESS,
  ERROR_DISTRIBUTION_FAILURE
] = actionTypes;

const INITIAL_DATA = { buckets: [], totalHits: 0 };

export default createReducer(actionTypes, INITIAL_DATA);

export const loadErrorDistribution = createAction(
  actionTypes,
  rest.loadErrorDistribution
);

export function getErrorDistribution(state) {
  return state.errorDistribution;
}
