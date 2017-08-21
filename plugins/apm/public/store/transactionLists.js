import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const TRANSACTIONS_LIST_LOADING = 'TRANSACTIONS_LIST_LOADING';
export const TRANSACTIONS_LIST_SUCCESS = 'TRANSACTIONS_LIST_SUCCESS';
export const TRANSACTIONS_LIST_FAILURE = 'TRANSACTIONS_LIST_FAILURE';

// A single transaction list
const INITIAL_STATE = { data: [] };
function list(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRANSACTIONS_LIST_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case TRANSACTIONS_LIST_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case TRANSACTIONS_LIST_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

// An collection of transaction lists
const transactionLists = (state = {}, action) => {
  switch (action.type) {
    case TRANSACTIONS_LIST_LOADING:
    case TRANSACTIONS_LIST_SUCCESS:
    case TRANSACTIONS_LIST_FAILURE:
      return {
        ...state,
        [action.key]: list(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadTransactionList({ appName, start, end, transactionType }) {
  return async dispatch => {
    const key = `${appName}_${start}_${end}_${transactionType}`;
    dispatch({ type: TRANSACTIONS_LIST_LOADING, key });

    let response;
    try {
      response = await rest.loadTransactionList({
        appName,
        start,
        end,
        transactionType
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: TRANSACTIONS_LIST_FAILURE
      });
    }

    return dispatch({
      response,
      key,
      type: TRANSACTIONS_LIST_SUCCESS
    });
  };
}

export function getTransactionList(state) {
  const { appName, start, end, transactionType } = getUrlParams(state);
  const key = `${appName}_${start}_${end}_${transactionType}`;
  return state.transactionLists[key] || INITIAL_STATE;
}

export default transactionLists;
