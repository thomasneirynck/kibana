import { createSelector } from 'reselect';
import * as rest from '../services/rest';
import { createActionTypes, createAction, createReducer } from './apiHelpers';
import { getCharts } from './selectors/chartSelectors';
import { getUrlParams } from './urlParams';

const actionTypes = createActionTypes('DETAILS_CHARTS');

const INITIAL_DATA = {
  totalHits: 0,
  dates: [],
  responseTimes: {},
  tpmBuckets: [],
  weightedAverage: null
};

export default createReducer(actionTypes, INITIAL_DATA);
export const loadDetailsCharts = createAction(actionTypes, rest.loadCharts);

export const getDetailsCharts = createSelector(
  getUrlParams,
  state => state.detailsCharts,
  getCharts
);
