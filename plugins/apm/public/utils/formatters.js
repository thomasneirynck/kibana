import { memoize } from 'lodash';
import numeral from '@elastic/numeral';

const UNIT_CUT_OFF = 10 * 1000000;

export function asSeconds(value, withUnit = true) {
  const formatted = numeral(value / 1000000).format('0,0.0');
  return `${formatted}${withUnit ? ' s' : ''}`;
}

export function asMillis(value, withUnit = true) {
  const formatted = numeral(value / 1000).format('0,0');
  return `${formatted}${withUnit ? ' ms' : ''}`;
}

export function asMillisWithDefault(value) {
  if (value == null) {
    return `N/A`;
  }
  return asMillis(value);
}

export const getTimeFormatter = memoize(
  max => (max > UNIT_CUT_OFF ? asSeconds : asMillis)
);

export function getUnit(max) {
  return max > UNIT_CUT_OFF ? 's' : 'ms';
}

export const getTimeFormatterWithoutUnit = memoize(
  max =>
    max > UNIT_CUT_OFF
      ? value => asSeconds(value, false)
      : value => asMillis(value, false)
);

export function asRpm(value, withUnit = true) {
  if (value == null) {
    return `N/A`;
  }
  const formattedRpm = numeral(value).format('0.0');
  return `${formattedRpm}${withUnit ? ' rpm' : ''}`;
}
