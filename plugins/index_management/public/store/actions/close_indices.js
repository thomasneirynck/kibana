import { createAction } from "redux-actions";
import { closeIndices as request } from "../../services";
import { toastNotifications } from 'ui/notify';
import { reloadIndices } from "../actions";

export const closeIndicesStart = createAction(
  "INDEX_MANAGEMENT_CLOSE_INDICES_START"
);
export const closeIndices = ({ indexNames }) => async (dispatch) => {
  dispatch(closeIndicesStart({ indexNames }));
  try {
    await request(indexNames);
  } catch (error) {
    return toastNotifications.addDanger(error.data.message);
  }
  dispatch(reloadIndices(indexNames));
  toastNotifications.addSuccess(`Successfully closed: [${indexNames.join(", ")}]`);
};
