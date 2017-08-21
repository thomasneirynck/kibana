import { getUrlParams } from './urlParams';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const ERROR_GROUP_LIST_LOADING = 'ERROR_GROUP_LIST_LOADING';
export const ERROR_GROUP_LIST_SUCCESS = 'ERROR_GROUP_LIST_SUCCESS';
export const ERROR_GROUP_LIST_FAILURE = 'ERROR_GROUP_LIST_FAILURE';

// A single error list
const INITIAL_STATE = { data: [] };
function list(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ERROR_GROUP_LIST_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case ERROR_GROUP_LIST_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case ERROR_GROUP_LIST_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

// An collection of error lists
const errorGroupLists = (state = {}, action) => {
  switch (action.type) {
    case ERROR_GROUP_LIST_LOADING:
    case ERROR_GROUP_LIST_SUCCESS:
    case ERROR_GROUP_LIST_FAILURE:
      return {
        ...state,
        [action.key]: list(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadErrorGroupList({ appName, start, end }) {
  return async dispatch => {
    const key = `${appName}_${start}_${end}`;
    dispatch({ type: ERROR_GROUP_LIST_LOADING, key });

    let response;
    try {
      response = await rest.loadErrorGroupList({
        appName,
        start,
        end
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: ERROR_GROUP_LIST_FAILURE
      });
    }

    return dispatch({
      response,
      key,
      type: ERROR_GROUP_LIST_SUCCESS
    });
  };
}

export function getErrorGroupList(state) {
  const { appName, start, end } = getUrlParams(state);
  const key = `${appName}_${start}_${end}`;
  return state.errorGroupLists[key] || INITIAL_STATE;
}

export default errorGroupLists;
