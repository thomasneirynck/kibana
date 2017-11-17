import { memoize } from 'lodash';
import numeral from '@elastic/numeral';

const UNIT_CUT_OFF = 10 * 1000000;

export function asSeconds(value, withUnit = true) {
  const formatted = asDecimal(value / 1000000);
  return `${formatted}${withUnit ? ' s' : ''}`;
}

export function asMillis(value, withUnit = true) {
  const formatted = asInteger(value / 1000);
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

export function timeUnit(max) {
  return max > UNIT_CUT_OFF ? 's' : 'ms';
}

export const getTimeFormatterWithoutUnit = memoize(
  max =>
    max > UNIT_CUT_OFF
      ? value => asSeconds(value, false)
      : value => asMillis(value, false)
);

export function asDecimal(value) {
  return numeral(value).format('0,0.0');
}

export function asInteger(value) {
  return numeral(value).format('0,0');
}

export function tpmUnit(type) {
  return type === 'request' ? 'rpm' : 'tpm';
}
