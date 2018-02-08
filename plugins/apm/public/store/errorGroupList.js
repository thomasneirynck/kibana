import * as rest from '../services/rest';
import { createActionTypes, createAction, createReducer } from './apiHelpers';

const actionTypes = createActionTypes('ERROR_GROUP_LIST');
export const [
  ERROR_GROUP_LIST_LOADING,
  ERROR_GROUP_LIST_SUCCESS,
  ERROR_GROUP_LIST_FAILURE
] = actionTypes;

const INITIAL_DATA = [];
export default createReducer(actionTypes, INITIAL_DATA);

export const loadErrorGroupList = createAction(
  actionTypes,
  rest.loadErrorGroupList
);

export const getErrorGroupList = state => {
  return state.errorGroupList;
};
