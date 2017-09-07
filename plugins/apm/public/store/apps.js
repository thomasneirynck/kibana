import _ from 'lodash';
import * as rest from '../services/rest';
import {
  getKey,
  createActionTypes,
  createAction,
  createReducer
} from './apiHelpers';

const actionTypes = createActionTypes('APP');
export const [APP_LOADING, APP_SUCCESS, APP_FAILURE] = actionTypes;

const INITIAL_STATE = {
  data: {}
};

const app = createReducer(actionTypes, INITIAL_STATE);
const apps = (state = {}, action) => {
  if (!actionTypes.includes(action.type)) {
    return state;
  }

  return {
    ...state,
    [action.key]: app(state[action.key], action)
  };
};

export const loadApp = createAction(actionTypes, rest.loadApp);

export function getApp(state) {
  const { appName, start, end } = state.urlParams;
  const key = getKey({ appName, start, end });
  return state.apps[key] || INITIAL_STATE;
}

export function getDefaultTransactionType(state) {
  const _app = getApp(state);
  const types = _app.data.types;
  return _.first(types);
}

export default apps;
