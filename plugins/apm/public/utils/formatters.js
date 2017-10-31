import { memoize } from 'lodash';
import numeral from '@elastic/numeral';

export function asSeconds(value) {
  const formatted = numeral(value / 1000000).format('0,0.0');
  return `${formatted} s`;
}

export function asMillis(value) {
  const formatted = numeral(value / 1000).format('0,0');
  return `${formatted} ms`;
}

export function asMillisWithDefault(value) {
  if (value == null) {
    return `N/A`;
  }
  return asMillis(value);
}

export const getTimeFormatter = memoize(
  max => (max > 5000000 ? asSeconds : asMillis)
);

export function asRpm(value) {
  if (value == null) {
    return `N/A`;
  }
  const formattedRpm = numeral(value).format('0.0');
  return `${formattedRpm} rpm`;
}
