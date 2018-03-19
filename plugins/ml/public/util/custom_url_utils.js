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

// utility functions for handling custom URLs

import moment from 'moment';

import { parseInterval } from 'plugins/ml/../common/util/parse_interval';
import { replaceStringTokens } from 'plugins/ml/util/string_utils';

// Replaces the $ delimited tokens in the url_value of the custom URL configuration
// with values from the supplied document.
export function replaceTokensInUrlValue(customUrlConfig, jobBucketSpanSecs, doc, timeFieldName) {
  // If urlValue contains $earliest$ and $latest$ tokens, add in times to the test doc.
  const urlValue = customUrlConfig.url_value;
  const timestamp = doc[timeFieldName];
  const timeRangeInterval = parseInterval(customUrlConfig.time_range);
  if (urlValue.includes('$earliest$')) {
    const earliestMoment = moment(timestamp);
    if (timeRangeInterval !== null) {
      earliestMoment.subtract(timeRangeInterval);
    } else {
      earliestMoment.subtract(jobBucketSpanSecs, 's');
    }
    doc.earliest = earliestMoment.toISOString();
  }

  if (urlValue.includes('$latest$')) {
    const latestMoment = moment(timestamp).add(jobBucketSpanSecs, 's');
    if (timeRangeInterval !== null) {
      latestMoment.add(timeRangeInterval);
    } else {
      latestMoment.add(jobBucketSpanSecs, 's');
    }
    doc.latest = latestMoment.toISOString();
  }

  const url = replaceStringTokens(urlValue, doc, true);
  return url;
}
