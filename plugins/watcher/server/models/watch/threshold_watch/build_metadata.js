/*
watch.metadata
 */

export function buildMetadata(watch) {
  return {
    watcherui: {
      index: watch.index,
      timeField: watch.timeField,
      triggerIntervalSize: watch.triggerIntervalSize,
      triggerIntervalUnit: watch.triggerIntervalUnit,
      aggType: watch.aggType,
      aggField: watch.aggField,
      termSize: watch.termSize,
      termField: watch.termField,
      thresholdComparator: watch.thresholdComparator,
      timeWindowSize: watch.timeWindowSize,
      timeWindowUnit: watch.timeWindowUnit,
      threshold: watch.threshold
    }
  };
}
