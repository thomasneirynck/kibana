import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const TRANSACTION_LOADING = 'TRANSACTION_LOADING';
export const TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS';
export const TRANSACTION_FAILURE = 'TRANSACTION_FAILURE';

// REDUCER
const INITIAL_STATE = { data: {} };
function transaction(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRANSACTION_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case TRANSACTION_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case TRANSACTION_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const transactions = (state = {}, action) => {
  switch (action.type) {
    case TRANSACTION_LOADING:
    case TRANSACTION_SUCCESS:
    case TRANSACTION_FAILURE:
      return {
        ...state,
        [action.key]: transaction(state[action.key], action),
        lastSuccess:
          action.type === TRANSACTION_SUCCESS ? action.key : state.lastSuccess
      };
    default:
      return state;
  }
};

// ACTION CREATOR
export function loadTransaction({ appName, start, end, transactionId }) {
  return async dispatch => {
    const key = transactionId;
    dispatch({ type: TRANSACTION_LOADING, key });

    try {
      const response = await rest.loadTransaction({
        appName,
        start,
        end,
        transactionId
      });
      return dispatch({
        response,
        key,
        type: TRANSACTION_SUCCESS
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: TRANSACTION_FAILURE
      });
    }
  };
}

// SELECTOR
export function getTransactionNext(state) {
  const { transactionId: key } = getUrlParams(state);
  return state.transactions[key] || INITIAL_STATE;
}

export function getTransaction(state) {
  const next = getTransactionNext(state);
  const key = state.transactions.lastSuccess;
  const prev = state.transactions[key] || INITIAL_STATE;
  return next.status === STATUS.SUCCESS ? next : prev;
}

export default transactions;
