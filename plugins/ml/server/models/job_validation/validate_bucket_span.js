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

import { VALIDATION_STATUS } from '../../../common/constants/validation';
import { parseInterval } from '../../../common/util/parse_interval.js';

const BUCKET_SPAN_HIGH_THRESHOLD = 1;

export function validateBucketSpan(callWithRequest, job) {
  const messages = [];
  const bucketSpanDays = parseInterval(job.analysis_config.bucket_span).asDays();

  if (bucketSpanDays >= BUCKET_SPAN_HIGH_THRESHOLD) {
    messages.push({
      status: VALIDATION_STATUS.INFO,
      id: `high_bucket_span`
    });
  }

  return messages;
}
