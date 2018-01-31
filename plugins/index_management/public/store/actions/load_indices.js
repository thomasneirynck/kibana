import { createAction } from 'redux-actions';
import { loadIndices as request } from '../../services';
import { toastNotifications } from 'ui/notify';

export const loadIndicesSuccess = createAction('INDEX_MANAGEMENT_LOAD_INDICES_SUCCESS');
export const loadIndices = () => async (dispatch) => {
  let indices;
  try {
    indices = await request();
  } catch (error) {
    return toastNotifications.addDanger(error.data.message);
  }
  dispatch(loadIndicesSuccess({ indices }));
};
