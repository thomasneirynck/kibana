import * as rest from '../services/rest';
import orderBy from 'lodash.orderby';
import { getUrlParams } from './urlParams';
import { createSelector } from 'reselect';
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
export const getAppList = createSelector(
  state => state.appLists,
  state => state.sorting.app,
  getUrlParams,
  (appLists, appSorting, urlParams) => {
    const { start, end } = urlParams;
    const key = getKey({ start, end });

    if (!appLists[key]) {
      return INITIAL_STATE;
    }

    const { key: sortKey, descending } = appSorting;

    return {
      ...appLists[key],
      data: orderBy(appLists[key].data, sortKey, descending ? 'desc' : 'asc')
    };
  }
);

export default appLists;
