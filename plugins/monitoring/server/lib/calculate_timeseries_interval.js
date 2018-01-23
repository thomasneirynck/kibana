import moment from 'moment';
import { calculateAuto } from './calculate_auto';

export function calculateTimeseriesInterval(lowerBoundInMsSinceEpoch, upperBoundInMsSinceEpoch, minIntervalSeconds) {
  const duration = moment.duration(upperBoundInMsSinceEpoch - lowerBoundInMsSinceEpoch, 'ms');

  return Math.max(minIntervalSeconds, calculateAuto(100, duration).asSeconds());
}
