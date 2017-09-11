import numeral from '@elastic/numeral';

export function getFormattedResponseTime(duration) {
  if (!duration && duration !== 0) {
    return `N/A`;
  }
  const formattedDuration = numeral(duration).format('0,0');
  return `${formattedDuration} ms`;
}

export function getFormattedRequestsPerMinute(rpm) {
  if (!rpm && rpm !== 0) {
    return `N/A`;
  }
  const formattedRpm = numeral(rpm).format('0.0');
  return `${formattedRpm} rpm`;
}
