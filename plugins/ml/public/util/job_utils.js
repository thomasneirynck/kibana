/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

const _ = require('lodash');

// work out the default frequency based on the bucket_span in seconds
export function calculateDatafeedFrequencyDefaultSeconds(bucketSpanSeconds) {

  let freq = 3600;
  if (bucketSpanSeconds <= 120) {
    freq = 60;
  } else if (bucketSpanSeconds <= 1200) {
    freq = Math.floor(bucketSpanSeconds / 2);
  } else if (bucketSpanSeconds <= 43200) {
    freq = 600;
  }

  return freq;
}

// Returns a flag to indicate whether the job is suitable for viewing
// in the Time Series dashboard.
export function isTimeSeriesViewJob(job) {
  // TODO - do we need another function which returns whether to enable the
  // link to the Single Metric dashboard in the Jobs list, only allowing single
  // metric jobs with only one detector with no by/over/partition fields

  // only allow jobs with at least one detectors whose function corresponds to
  // an ES aggregation which can be viewed in the single metric view
  let isViewable = false;
  const dtrs = job.analysis_config.detectors;
  isViewable = _.some(dtrs, (dtr) => {
    return ((isTimeSeriesViewFunction(dtr.function) === true) && (dtr.by_field_name !== 'mlcategory'));
  });

  return isViewable;
}

// Returns a flag to indicate whether a detector with the specified function is
// suitable for viewing in the Time Series dashboard.
export function isTimeSeriesViewFunction(functionName) {
  return mlFunctionToESAggregation(functionName) !== null;
}

export function isModelPlotEnabled(job) {
  return _.get(job, ['model_plot_config', 'enabled'], false);
}

// Takes an ML detector 'function' and returns the corresponding ES aggregation name
// for querying metric data. Returns null if there is no suitable ES aggregation.
// Note that the 'function' field in a record contains what the user entered e.g. 'high_count',
// whereas the 'function_description' field holds an ML-built display hint for function e.g. 'count'.
export function mlFunctionToESAggregation(functionName) {
  if (functionName === 'mean' || functionName === 'high_mean' || functionName === 'low_mean' ||
    functionName === 'metric') {
    return 'avg';
  }

  if (functionName === 'sum' || functionName === 'high_sum' || functionName === 'low_sum' ||
    functionName === 'non_null_sum' || functionName === 'low_non_null_sum' || functionName === 'high_non_null_sum') {
    return 'sum';
  }

  if (functionName === 'count' || functionName === 'high_count' || functionName === 'low_count' ||
    functionName === 'non_zero_count' || functionName === 'low_non_zero_count' || functionName === 'high_non_zero_count') {
    return 'count';
  }

  if (functionName === 'distinct_count' || functionName === 'low_distinct_count' || functionName === 'high_distinct_count') {
    return 'cardinality';
  }

  if (functionName === 'min' || functionName === 'max') {
    return functionName;
  }

  // Return null if ML function does not map to an ES aggregation.
  // i.e. median, low_median, high_median, rare, freq_rare,
  // varp, low_varp, high_varp, time_of_day, time_of_week, lat_long,
  // info_content, low_info_content, high_info_content
  return null;
}
