import * as rest from '../services/rest';
import { createActionTypes, createAction, createReducer } from './apiHelpers';

const actionTypes = createActionTypes('TRANSACTION');
export const [
  TRANSACTION_LOADING,
  TRANSACTION_SUCCESS,
  TRANSACTION_FAILURE
] = actionTypes;

const INITIAL_DATA = {};
const transaction = createReducer(actionTypes, INITIAL_DATA);

export const loadTransaction = createAction(actionTypes, rest.loadTransaction);

export function getTransaction(state) {
  return state.transaction;
}

export default transaction;
