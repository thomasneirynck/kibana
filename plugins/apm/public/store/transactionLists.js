import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { getSortedList } from './transactionSorting';
import {
  getKey,
  createActionTypes,
  createAction,
  createReducer
} from './apiHelpers';

const actionTypes = createActionTypes('TRANSACTIONS_LIST');
export const [
  TRANSACTIONS_LIST_LOADING,
  TRANSACTIONS_LIST_SUCCESS,
  TRANSACTIONS_LIST_FAILURE
] = actionTypes;

const INITIAL_STATE = { data: [] };
const list = createReducer(actionTypes, INITIAL_STATE);
const transactionLists = (state = {}, action) => {
  if (!actionTypes.includes(action.type)) {
    return state;
  }

  return {
    ...state,
    [action.key]: list(state[action.key], action)
  };
};

export const loadTransactionList = createAction(
  actionTypes,
  rest.loadTransactionList
);

export function getTransactionList(state) {
  const { appName, start, end, transactionType } = getUrlParams(state);
  const key = getKey({ appName, start, end, transactionType });

  if (!state.transactionLists[key]) {
    return INITIAL_STATE;
  }

  return {
    ...state.transactionLists[key],
    data: getSortedList(state.transactionLists[key].data, state)
  };
}

export default transactionLists;
