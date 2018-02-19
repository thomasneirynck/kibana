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

const INFLUENCER_LOW_THRESHOLD = 0;
const INFLUENCER_HIGH_THRESHOLD = 4;
const DETECTOR_FIELD_NAMES_THRESHOLD = 1;

export async function validateInfluencer(callWithRequest, job) {
  const messages = [];
  const influencers = job.analysis_config.influencers.length;

  const detectorFieldNames = [];
  job.analysis_config.detectors.forEach((d) => {
    if (d.partition_field_name) {
      detectorFieldNames.push(d.partition_field_name);
    }
    if (d.over_field_name) {
      detectorFieldNames.push(d.over_field_name);
    }
  });

  if (
    influencers <= INFLUENCER_LOW_THRESHOLD &&
    detectorFieldNames.length >= DETECTOR_FIELD_NAMES_THRESHOLD
  ) {
    let influencerSuggestion = `"${detectorFieldNames[0]}"`;
    let id = 'influencer_low_suggestion';

    if (detectorFieldNames.length > 1) {
      id = 'influencer_low_suggestions';
      const uniqueInfluencers = [...new Set(detectorFieldNames)];
      influencerSuggestion = `[${uniqueInfluencers.map(i => `"${i}"`).join(',')}]`;
    }

    messages.push({
      status: VALIDATION_STATUS.WARNING,
      id,
      influencerSuggestion
    });
  } else if (influencers >= INFLUENCER_HIGH_THRESHOLD) {
    messages.push({
      status: VALIDATION_STATUS.WARNING,
      id: 'influencer_high'
    });
  }

  return Promise.resolve(messages);
}
