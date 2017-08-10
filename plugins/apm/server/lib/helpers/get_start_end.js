import moment from 'moment';
export function getStartEnd(start, end) {
  const startTs = moment.utc(start);
  const endTs = moment.utc(end);
  return { start: startTs.valueOf(), end: endTs.valueOf() };
}
