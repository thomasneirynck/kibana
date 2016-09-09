import { some } from 'lodash';
import datemath from '@elastic/datemath';
import rison from 'rison-node';
import moment from 'moment';

export default function getTimeFilterRange(savedObjects, query = {}) {
  if (!query._g) {
    return;
  }

  const hasTimeBasedIndexPattern = some(savedObjects, { isUsingTimeBasedIndexPattern: true });
  if (!hasTimeBasedIndexPattern) {
    return;
  }

  const globalState = rison.decode(query._g);
  if (!globalState.time) {
    return;
  }

  const from = moment(datemath.parse(globalState.time.from).toISOString()).format('llll');
  const to = moment(datemath.parse(globalState.time.to).toISOString()).format('llll');
  return { from, to };
}
