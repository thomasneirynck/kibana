import _ from 'lodash';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const APP_LOADING = 'APP_LOADING';
export const APP_SUCCESS = 'APP_SUCCESS';
export const APP_FAILURE = 'APP_FAILURE';

// REDUCER
const INITIAL_STATE = {
  data: {}
};

function app(state = INITIAL_STATE, action) {
  switch (action.type) {
    case APP_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case APP_SUCCESS: {
      return {
        data: action.response || INITIAL_STATE.data,
        status: STATUS.SUCCESS
      };
    }

    case APP_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const apps = (state = {}, action) => {
  switch (action.type) {
    case APP_LOADING:
    case APP_SUCCESS:
    case APP_FAILURE:
      return {
        ...state,
        [action.key]: app(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadApp({ appName, start, end }) {
  return async dispatch => {
    const key = `${appName}_${start}_${end}`;
    dispatch({ type: APP_LOADING, key });

    let response;
    try {
      response = await rest.loadApp({ appName, start, end });
    } catch (error) {
      return dispatch({
        key,
        error: error.error,
        type: APP_FAILURE
      });
    }

    return dispatch({
      key,
      response,
      type: APP_SUCCESS
    });
  };
}

export function getApp(state) {
  const { appName, start, end } = state.urlParams;
  const key = `${appName}_${start}_${end}`;
  return state.apps[key] || INITIAL_STATE;
}

export function getDefaultTransactionType(state) {
  const _app = getApp(state);
  const types = _app.data.types;
  return _.first(types);
}

export default apps;
