import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { STATUS } from '../constants';
import {
  getKey,
  createActionTypes,
  createAction,
  createReducer
} from './apiHelpers';

const actionTypes = createActionTypes('TRACES');
export const [TRACES_LOADING, TRACES_SUCCESS, TRACES_FAILURE] = actionTypes;

const INITIAL_STATE = { data: {} };
const traces = createReducer(actionTypes, INITIAL_STATE);
const tracesCollection = (state = {}, action) => {
  if (!actionTypes.includes(action.type)) {
    return state;
  }

  return {
    ...state,
    [action.key]: traces(state[action.key], action),
    lastSuccess: action.type === TRACES_SUCCESS ? action.key : state.lastSuccess
  };
};

export const loadTraces = createAction(actionTypes, rest.loadTraces);

export function getTracesNext(state) {
  const { appName, start, end, transactionId } = getUrlParams(state);
  const key = getKey({ appName, start, end, transactionId });
  return state.traces[key] || INITIAL_STATE;
}

export function getTraces(state) {
  const next = getTracesNext(state);
  const key = state.traces.lastSuccess;
  const prev = state.traces[key] || INITIAL_STATE;
  return next.status === STATUS.SUCCESS ? next : prev;
}

export default tracesCollection;
