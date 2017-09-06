import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const DISTRIBUTION_LOADING = 'ERROR_DISTRIBUTION_LOADING';
export const DISTRIBUTION_SUCCESS = 'ERROR_DISTRIBUTION_SUCCESS';
export const DISTRIBUTION_FAILURE = 'ERROR_DISTRIBUTION_FAILURE';

const INITIAL_STATE = { data: { buckets: [] } };
function distribution(state = INITIAL_STATE, action) {
  switch (action.type) {
    case DISTRIBUTION_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case DISTRIBUTION_SUCCESS: {
      return { data: action.response, status: STATUS.SUCCESS };
    }

    case DISTRIBUTION_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const errorDistributions = (state = {}, action) => {
  switch (action.type) {
    case DISTRIBUTION_LOADING:
    case DISTRIBUTION_SUCCESS:
    case DISTRIBUTION_FAILURE:
      return {
        ...state,
        [action.key]: distribution(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadErrorDistribution({ appName, start, end, errorGroupId }) {
  return async dispatch => {
    const key = `${appName}_${start}_${end}_${errorGroupId}`;
    dispatch({ type: DISTRIBUTION_LOADING, key });

    let response;
    try {
      response = await rest.loadErrorDistribution({
        appName,
        start,
        end,
        errorGroupId
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: DISTRIBUTION_FAILURE
      });
    }

    return dispatch({
      response,
      key,
      type: DISTRIBUTION_SUCCESS
    });
  };
}

export function getErrorDistribution(state) {
  const { appName, start, end, errorGroupId } = state.urlParams;
  const key = `${appName}_${start}_${end}_${errorGroupId}`;
  return state.errorDistributions[key] || INITIAL_STATE;
}

export default errorDistributions;
