import * as rest from '../services/rest';
import {
  getKey,
  createActionTypes,
  createAction,
  createReducer
} from './apiHelpers';

const actionTypes = createActionTypes('APP_LIST');
export const [
  APP_LIST_LOADING,
  APP_LIST_SUCCESS,
  APP_LIST_FAILURE
] = actionTypes;

const INITIAL_STATE = {
  data: []
};
const list = createReducer(actionTypes, INITIAL_STATE);
const appLists = (state = {}, action) => {
  if (!actionTypes.includes(action.type)) {
    return state;
  }

  return {
    ...state,
    [action.key]: list(state[action.key], action)
  };
};

export const loadAppList = createAction(actionTypes, rest.loadAppList);

// SELECTORS
export function getAppList(state) {
  const { start, end } = state.urlParams;
  const key = getKey({ start, end });
  return state.appLists[key] || INITIAL_STATE;
}

export default appLists;
