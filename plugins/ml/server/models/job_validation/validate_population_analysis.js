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

import _ from 'lodash';

import { VALIDATION_STATUS } from '../../../common/constants/validation';
import { DataVisualizer } from '../data_visualizer';

// Threshold to determine whether cardinality is
// too high or low for population analysis
const CARDINALITY_THRESHOLD = 100;

export async function validatePopulationAnalysis(callWithRequest, job) {
  const dv = new DataVisualizer(callWithRequest);

  const messages = [];

  const detectors = job.analysis_config.detectors;

  const overFieldNameDetectors = _.filter(detectors, (detector) => {
    return typeof detector.over_field_name !== 'undefined';
  });

  const isPopulationAnalysis = overFieldNameDetectors.length > 0;

  if (isPopulationAnalysis) {
    const stats = await dv.checkAggregatableFieldsExist(
      job.datafeed_config.indices[0],
      job.datafeed_config.query,
      overFieldNameDetectors.map(f => f.over_field_name),
      0,
      job.data_description.time_field
    );

    overFieldNameDetectors.forEach((d) => {
      const field = _.find(stats.aggregatableExistsFields, { fieldName: d.over_field_name });
      if (typeof field === 'object') {
        if (field.stats.cardinality <= CARDINALITY_THRESHOLD) {
          messages.push({
            status: VALIDATION_STATUS.WARNING,
            id: 'over_field_low_cardinality',
            fieldName: d.over_field_name
          });
        }
      } else {
        messages.push({
          status: VALIDATION_STATUS.ERROR,
          id: 'over_field_not_aggregatable',
          fieldName: d.over_field_name
        });
      }
    });
  }

  return messages;
}
