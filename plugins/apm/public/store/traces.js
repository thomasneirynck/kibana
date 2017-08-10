import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const TRACES_LOADING = 'TRACES_LOADING';
export const TRACES_SUCCESS = 'TRACES_SUCCESS';
export const TRACES_FAILURE = 'TRACES_FAILURE';

const INITIAL_STATE = { data: [] };
function traces(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRACES_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case TRACES_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case TRACES_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const tracesCollection = (state = {}, action) => {
  switch (action.type) {
    case TRACES_LOADING:
    case TRACES_SUCCESS:
    case TRACES_FAILURE:
      return {
        ...state,
        [action.key]: traces(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadTraces({ appName, start, end, transactionId }) {
  return async dispatch => {
    const key = transactionId;
    dispatch({ type: TRACES_LOADING, key });

    try {
      const response = await rest.loadTraces({
        appName,
        start,
        end,
        transactionId
      });
      return dispatch({
        response,
        key,
        type: TRACES_SUCCESS
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: TRACES_FAILURE
      });
    }
  };
}

export function getTraces(state) {
  const { transactionId: key } = getUrlParams(state);
  return state.traces[key] || INITIAL_STATE;
}

export default tracesCollection;
