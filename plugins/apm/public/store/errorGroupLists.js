import orderBy from 'lodash.orderby';
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

export const getErrorGroupList = createSelector(
  state => state.errorGroupLists,
  state => state.sorting.errorGroup,
  getUrlParams,
  (errorGroupLists, errorGroupSorting, urlParams) => {
    const { appName, start, end } = urlParams;
    const key = getKey({ appName, start, end });

    if (!errorGroupLists[key]) {
      return INITIAL_STATE;
    }

    const { key: sortKey, descending } = errorGroupSorting;

    return {
      ...errorGroupLists[key],
      data: orderBy(
        errorGroupLists[key].data,
        sortKey,
        descending ? 'desc' : 'asc'
      )
    };
  }
);

export default errorGroupLists;
