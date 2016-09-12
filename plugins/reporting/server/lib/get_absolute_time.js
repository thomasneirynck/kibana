const _ = require('lodash');
const datemath = require('@elastic/datemath');

function getAbsoluteTime(time) {
  const mode = _.get(time, 'mode');
  const timeFrom = _.get(time, 'from');
  const timeTo = _.get(time, 'to');
  const roundToEnd = true;

  if (!mode || !timeFrom || !timeTo) return time;
  if (mode === 'absolute') return time;

  const output = { mode: 'absolute' };
  output.from = datemath.parse(timeFrom);
  output.to = datemath.parse(timeTo, roundToEnd);
  return output;
}

module.exports = getAbsoluteTime;