import _ from 'lodash';
import { updateLocation } from '../store/location';

export default function connectHistoryToStore(history, dispatch) {
  function init() {
    const location = history.location;
    dispatch(updateLocation(location));
  }
  init();

  history.listen(
    _.debounce(location => {
      dispatch(updateLocation(location));
    }, 10)
  );
}
