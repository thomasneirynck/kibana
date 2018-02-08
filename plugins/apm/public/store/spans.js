import * as rest from '../services/rest';
import { createActionTypes, createAction, createReducer } from './apiHelpers';

const actionTypes = createActionTypes('SPANS');
export const [SPANS_LOADING, SPANS_SUCCESS, SPANS_FAILURE] = actionTypes;

const INITIAL_DATA = {};
const spans = createReducer(actionTypes, INITIAL_DATA);
export const loadSpans = createAction(actionTypes, rest.loadSpans);

export function getSpans(state) {
  return state.spans;
}

export default spans;
