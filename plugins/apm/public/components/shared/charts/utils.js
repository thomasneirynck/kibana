import numeral from '@elastic/numeral';

export function getYMaxRounded(yMax) {
  if (yMax <= 0) {
    return 0;
  }

  const yMaxUpper = yMax * 1.1;
  const initialBase = Math.floor(Math.log10(yMaxUpper));
  const base = initialBase > 2 ? initialBase - 1 : initialBase;
  return Math.ceil(yMaxUpper / 10 ** base) * 10 ** base;
}

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
