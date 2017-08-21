import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const LICENSE_LOADING = 'LICENSE_LOADING';
export const LICENSE_SUCCESS = 'LICENSE_SUCCESS';
export const LICENSE_FAILURE = 'LICENSE_FAILURE';

function license(state = {}, action) {
  switch (action.type) {
    case LICENSE_SUCCESS: {
      return {
        data: action.license,
        status: STATUS.SUCCESS
      };
    }
    default:
      return state;
  }
}

export function loadLicense() {
  return async dispatch => {
    dispatch({ type: LICENSE_LOADING });

    let response;
    try {
      response = await rest.loadLicense();
    } catch (error) {
      return dispatch({
        error: error.error,
        type: LICENSE_FAILURE
      });
    }

    dispatch({ type: LICENSE_SUCCESS, license: response });
  };
}

export default license;
