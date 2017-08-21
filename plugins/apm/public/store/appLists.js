import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const APP_LIST_LOADING = 'APP_LIST_LOADING';
export const APP_LIST_SUCCESS = 'APP_LIST_SUCCESS';
export const APP_LIST_FAILURE = 'APP_LIST_FAILURE';

// REDUCER
const INITIAL_STATE = {
  data: []
};

function list(state = INITIAL_STATE, action) {
  switch (action.type) {
    case APP_LIST_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case APP_LIST_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case APP_LIST_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const appLists = (state = {}, action) => {
  switch (action.type) {
    case APP_LIST_LOADING:
    case APP_LIST_SUCCESS:
    case APP_LIST_FAILURE:
      return {
        ...state,
        [action.key]: list(state[action.key], action)
      };
    default:
      return state;
  }
};

// ACTION CREATORS
export function loadAppList({ start, end }) {
  return async dispatch => {
    const key = `${start}_${end}`;
    dispatch({ type: APP_LIST_LOADING, key });

    let response;
    try {
      response = await rest.loadAppList({
        start,
        end
      });
    } catch (error) {
      return dispatch({
        key,
        error: error.error,
        type: APP_LIST_FAILURE
      });
    }

    return dispatch({
      key,
      response,
      type: APP_LIST_SUCCESS
    });
  };
}

// SELECTORS
export function getAppList(state) {
  const { start, end } = state.urlParams;
  const key = `${start}_${end}`;
  return state.appLists[key] || INITIAL_STATE;
}

export default appLists;
