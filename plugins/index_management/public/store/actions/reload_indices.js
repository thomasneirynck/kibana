import { createAction } from 'redux-actions';
import { getIndexNamesForCurrentPage } from '../selectors';
import { reloadIndices as request } from '../../services';
import { toastNotifications } from 'ui/notify';

export const reloadIndicesSuccess = createAction('INDEX_MANAGEMENT_RELOAD_INDICES_SUCCESS');
export const reloadIndices = (indexNames) => async (dispatch, getState) => {
  let indices;
  indexNames = indexNames || getIndexNamesForCurrentPage(getState());
  try {
    indices = await request(indexNames);
  } catch (error) {
    return toastNotifications.addDanger(error.data.message);
  }
  if (indices && indices.length > 0) {
    return dispatch(reloadIndicesSuccess({ indices }));
  } else {
    return toastNotifications.addSuccess('Failed to refresh current page of indices.');
  }
};
