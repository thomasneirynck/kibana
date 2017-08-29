import moment from 'moment';

/*
 * Calculate "Per-Second" Rate from Metrics
 * Uses first/last totals and time window bounds in millis
 *
 * Indexing rate example:
 * 1. Take the latest index total
 * 2. From that subtract the earliest index total
 * This gives you the numerator
 *
 * 3. Take the latest timestamp from the time picker
 * 4. From that subtract the earliest timestamp from the time picker
 * This gives you the denominator in millis. Divide it by 1000 to convert to seconds
 */
export function calculateRate(
  {
    hitTimestamp = null,
    earliestHitTimestamp = null,
    latestTotal = null,
    earliestTotal = null,
    timeWindowMin,
    timeWindowMax
  } = {}
) {
  // check if any params used for calculations are null
  if (hitTimestamp === null || earliestHitTimestamp === null || latestTotal === null || earliestTotal === null) {
    return null;
  }

  const hitTimestampMoment = moment(hitTimestamp).valueOf();
  const earliestHitTimestampMoment = moment(earliestHitTimestamp).valueOf();
  const hitsTimeDelta = hitTimestampMoment - earliestHitTimestampMoment;

  if (hitsTimeDelta < 1) {
    return null;
  }

  const earliestTimeInMillis = moment(timeWindowMin).valueOf();
  const latestTimeInMillis = moment(timeWindowMax).valueOf();
  const millisDelta = latestTimeInMillis - earliestTimeInMillis;

  let rate = null;
  if (millisDelta !== 0) {
    const totalDelta = latestTotal - earliestTotal;
    rate = totalDelta / (millisDelta / 1000);
  }

  return rate;
}
