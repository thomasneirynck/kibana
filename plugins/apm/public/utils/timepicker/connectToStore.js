import _ from 'lodash';
import { updateTimePicker } from '../../store/urlParams';

export default function connectToStore(timefilter, dispatch) {
  timefilter.on(
    'update',
    _.debounce(() => {
      dispatch(
        updateTimePicker({
          min: timefilter.getBounds().min.toISOString(),
          max: timefilter.getBounds().max.toISOString()
        })
      );
    }),
    10
  );
}
