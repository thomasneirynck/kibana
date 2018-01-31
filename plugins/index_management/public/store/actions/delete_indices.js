import { createAction } from "redux-actions";
import { deleteIndices as request } from "../../services";
import { toastNotifications } from 'ui/notify';

export const deleteIndicesSuccess = createAction(
  "INDEX_MANAGEMENT_DELETE_INDICES_SUCCESS"
);
export const deleteIndices = ({ indexNames }) => async (dispatch) => {
  try {
    await request(indexNames);
  } catch (error) {
    return toastNotifications.addDanger(error.data.message);
  }
  toastNotifications.addSuccess(`Successfully deleted: [${indexNames.join(", ")}]`);
  dispatch(deleteIndicesSuccess({ indexNames }));
};
