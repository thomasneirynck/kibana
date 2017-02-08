/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
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

// work out the default frequency based on the bucketSpan
function calculateDatafeedFrequencyDefault(bucketSpan) {

  let freq = 3600;
  if (bucketSpan <= 120) {
    freq = 60;
  } else if (bucketSpan <= 1200) {
    freq = Math.floor(bucketSpan / 2);
  } else if (bucketSpan <= 43200) {
    freq = 600;
  }

  return freq;
}

export default {
  calculateDatafeedFrequencyDefault: calculateDatafeedFrequencyDefault
};
