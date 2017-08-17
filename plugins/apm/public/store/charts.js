import _ from 'lodash';
import * as rest from '../services/rest';
import { STATUS } from '../constants';
import isNil from 'lodash.isnil';

// ACTION TYPES
export const CHARTS_LOADING = 'CHARTS_LOADING';
export const CHARTS_SUCCESS = 'CHARTS_SUCCESS';
export const CHARTS_FAILURE = 'CHARTS_FAILURE';

const INITIAL_STATE = {
  data: {
    response_times: {},
    rpm_per_status_class: {},
    rpm_per_status_class_average: {}
  }
};

function chartCollection(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CHARTS_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case CHARTS_SUCCESS: {
      return { data: action.response, status: STATUS.SUCCESS };
    }

    case CHARTS_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const charts = (state = {}, action) => {
  switch (action.type) {
    case CHARTS_LOADING:
    case CHARTS_SUCCESS:
    case CHARTS_FAILURE:
      return {
        ...state,
        [action.key]: chartCollection(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadCharts({
  appName,
  start,
  end,
  transactionName,
  transactionType,
  transactionId
}) {
  return async dispatch => {
    const key = getKey(
      appName,
      start,
      end,
      transactionName,
      transactionType,
      transactionId
    );
    dispatch({ type: CHARTS_LOADING, key });

    try {
      const response = await rest.loadCharts({
        appName,
        start,
        end,
        transactionName,
        transactionType,
        transactionId
      });
      return dispatch({
        response,
        key,
        type: CHARTS_SUCCESS
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: CHARTS_FAILURE
      });
    }
  };
}

export function getCharts(state, key) {
  return state.charts[key] || INITIAL_STATE;
}

export function getKey(...args) {
  return _.reject(args, isNil).join('_');
}

export default charts;
