import _ from 'lodash';
import isNil from 'lodash.isnil';
import { LOCATION_UPDATE } from './location';
import { toQuery, legacyDecodeURIComponent } from '../utils/url';
import {
  getDefaultTransactionId,
  getDefaultBucketIndex
} from './distributions';
import { getDefaultTransactionType } from './apps';

// ACTION TYPES
export const TIMEPICKER_UPDATE = 'TIMEPICKER_UPDATE';

// "urlParams" contains path and query parameters from the url, that can be easily consumed from
// any (container) component with access to the store

// Example:
// url: /opbeans-backend/Brewing%20Bot?transactionId=1321
// appName: opbeans-backend (path param)
// transactionType: Brewing%20Bot (path param)
// transactionId: 1321 (query param)
function urlParams(state = {}, action) {
  switch (action.type) {
    case LOCATION_UPDATE: {
      const {
        appName,
        transactionType,
        transactionName,
        errorGroupingId
      } = getPathParams(action.location.pathname);

      const { transactionId, detailTab, traceId, bucket } = toQuery(
        action.location.search
      );

      return {
        ...state,

        // query params
        transactionId,
        detailTab,
        traceId: toNumber(traceId),
        bucket: toNumber(bucket),

        // path params
        appName,
        transactionType,
        transactionName: legacyDecodeURIComponent(transactionName),
        errorGroupingId
      };
    }

    case TIMEPICKER_UPDATE:
      return { ...state, start: action.time.min, end: action.time.max };

    default:
      return state;
  }
}

function toNumber(value) {
  if (!isNil(value)) {
    return parseInt(value, 10);
  }
}

function getPathAsArray(pathname) {
  return _.compact(pathname.split('/'));
}

function getPathParams(pathname) {
  const paths = getPathAsArray(pathname);
  const pageName = paths[1];

  switch (pageName) {
    case 'transactions':
      return {
        appName: paths[0],
        transactionType: paths[2],
        transactionName: paths[3]
      };
    case 'errors':
      return {
        appName: paths[0],
        errorGroupingId: paths[2]
      };
    default:
      return {};
  }
}

// ACTION CREATORS
export function updateTimePicker(time) {
  return { type: TIMEPICKER_UPDATE, time };
}

// SELECTORS
// Note: make sure that none of the default selectors (eg. getDefaultTransactionId) calls getUrlParams,
// since this would cause an infinite loop
export function getUrlParams(state) {
  return _.defaults({}, state.urlParams, {
    transactionType: getDefaultTransactionType(state),
    transactionId: getDefaultTransactionId(state),
    bucket: getDefaultBucketIndex(state)
  });
}

export default urlParams;
