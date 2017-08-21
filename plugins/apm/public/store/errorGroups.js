import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const ERROR_GROUP_LOADING = 'ERROR_GROUP_LOADING';
export const ERROR_GROUP_SUCCESS = 'ERROR_GROUP_SUCCESS';
export const ERROR_GROUP_FAILURE = 'ERROR_GROUP_FAILURE';

// REDUCER
const INITIAL_STATE = {
  data: {}
};

function errorGroup(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ERROR_GROUP_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case ERROR_GROUP_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case ERROR_GROUP_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const errorGroups = (state = {}, action) => {
  switch (action.type) {
    case ERROR_GROUP_LOADING:
    case ERROR_GROUP_SUCCESS:
    case ERROR_GROUP_FAILURE:
      return {
        ...state,
        [action.key]: errorGroup(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadErrorGroup({ appName, errorGroupingId, start, end }) {
  return async dispatch => {
    const key = `${appName}_${errorGroupingId}_${start}_${end}`;
    dispatch({ type: ERROR_GROUP_LOADING, key });

    let response;
    try {
      response = await rest.loadErrorGroup({
        appName,
        errorGroupingId,
        start,
        end
      });
    } catch (error) {
      return dispatch({
        key,
        error: error.error,
        type: ERROR_GROUP_FAILURE
      });
    }

    return dispatch({
      key,
      response,
      type: ERROR_GROUP_SUCCESS
    });
  };
}

export function getErrorGroup(state) {
  const { appName, errorGroupingId, start, end } = state.urlParams;
  const key = `${appName}_${errorGroupingId}_${start}_${end}`;
  return state.errorGroups[key] || INITIAL_STATE;
}

export default errorGroups;
