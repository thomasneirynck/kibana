import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const TRANSACTION_LOADING = 'TRANSACTION_LOADING';
export const TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS';
export const TRANSACTION_FAILURE = 'TRANSACTION_FAILURE';

// REDUCER
const initialState = { data: {} };
function transaction(state = initialState, action) {
  switch (action.type) {
    case TRANSACTION_LOADING:
      return { ...initialState, status: STATUS.LOADING };

    case TRANSACTION_SUCCESS: {
      return {
        data: action.response || initialState.data,
        status: STATUS.SUCCESS
      };
    }

    case TRANSACTION_FAILURE:
      return {
        ...initialState,
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
        [action.key]: transaction(state[action.key], action)
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
export function getTransaction(state) {
  const { transactionId: key } = getUrlParams(state);
  return state.transactions[key] || initialState;
}

export default transactions;
