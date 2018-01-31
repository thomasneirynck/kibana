import { createAction } from "redux-actions";
import { toastNotifications } from 'ui/notify';
import { clearCacheIndices as request } from "../../services";
import { reloadIndices } from "../actions";

export const clearCacheIndicesStart = createAction(
  "INDEX_MANAGEMENT_CLEAR_CACHE_INDICES_START"
);
export const clearCacheIndices = ({ indexNames }) => async (dispatch) => {
  dispatch(clearCacheIndicesStart({ indexNames }));
  try {
    await request(indexNames);
  } catch (error) {
    return toastNotifications.addDanger(error.data.message);
  }
  dispatch(reloadIndices(indexNames));
  toastNotifications.addSuccess(`Successfully cleared cache: [${indexNames.join(", ")}]`);
};
