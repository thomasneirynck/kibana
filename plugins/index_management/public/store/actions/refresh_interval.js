import {
  REFRESH_RATE_INDEX_LIST
} from '../../constants';

import {
  getIndexNamesForCurrentPage
} from '../selectors';

import { reloadIndices } from '../actions';

const refreshList = (dispatch, getState) => () => {
  const indexNames = getIndexNamesForCurrentPage(getState());
  dispatch(reloadIndices(indexNames));
};

export const createRefreshInterval = (dispatch, getState) => {
  return setInterval(refreshList(dispatch, getState), REFRESH_RATE_INDEX_LIST);
};
