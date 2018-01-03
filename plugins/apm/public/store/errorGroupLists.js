import { createSelector } from 'reselect';
import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import {
  getKey,
  createActionTypes,
  createAction,
  createReducer
} from './apiHelpers';

const actionTypes = createActionTypes('ERROR_GROUP_LIST');
export const [
  ERROR_GROUP_LIST_LOADING,
  ERROR_GROUP_LIST_SUCCESS,
  ERROR_GROUP_LIST_FAILURE
] = actionTypes;

const INITIAL_STATE = { data: [] };
const list = createReducer(actionTypes, INITIAL_STATE);
const errorGroupLists = (state = {}, action) => {
  if (!actionTypes.includes(action.type)) {
    return state;
  }

  return {
    ...state,
    [action.key]: list(state[action.key], action)
  };
};

export const loadErrorGroupList = createAction(
  actionTypes,
  rest.loadErrorGroupList
);

export const getErrorGroupListArgs = createSelector(getUrlParams, urlParams => {
  const { serviceName, start, end, q, sortBy, sortOrder } = urlParams;
  return { serviceName, start, end, q, sortBy, sortOrder };
});

export const getErrorGroupListKey = state => {
  const args = getErrorGroupListArgs(state);
  return getKey(args);
};

export const getErrorGroupList = state => {
  const key = getErrorGroupListKey(state);

  if (!state.errorGroupLists[key]) {
    return INITIAL_STATE;
  }

  return state.errorGroupLists[key];
};

export default errorGroupLists;
