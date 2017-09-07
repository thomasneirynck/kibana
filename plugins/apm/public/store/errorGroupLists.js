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

export function getErrorGroupList(state) {
  const { appName, start, end } = getUrlParams(state);
  const key = getKey({ appName, start, end });
  return state.errorGroupLists[key] || INITIAL_STATE;
}

export default errorGroupLists;
