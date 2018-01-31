import { createAction } from "redux-actions";
import { openIndices as request } from "../../services";
import { reloadIndices } from "../actions";
import { toastNotifications } from 'ui/notify';

export const openIndicesStart = createAction(
  "INDEX_MANAGEMENT_OPEN_INDICES_START"
);

export const openIndices = ({ indexNames }) => async (dispatch) => {
  dispatch(openIndicesStart({ indexNames }));
  try {
    await request(indexNames);
  } catch (error) {
    return toastNotifications.addDanger(error.data.message);
  }
  dispatch(reloadIndices(indexNames));
  toastNotifications.addSuccess(`Successfully opened: [${indexNames.join(", ")}]`);
};
