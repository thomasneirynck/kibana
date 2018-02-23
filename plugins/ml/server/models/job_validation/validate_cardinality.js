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
const OVER_FIELD_CARDINALITY_THRESHOLD = 10;
const PARTITION_FIELD_CARDINALITY_THRESHOLD = 100;

const validateFactory = (callWithRequest, job) => {
  const dv = new DataVisualizer(callWithRequest);

  return async ({ type, isInvalid }) => {
    const messages = [];
    const fieldName = `${type}_field_name`;

    const detectors = job.analysis_config.detectors;
    const relevantDetectors = _.filter(detectors, (detector) => {
      return typeof detector[fieldName] !== 'undefined';
    });

    if (relevantDetectors.length > 0) {
      const stats = await dv.checkAggregatableFieldsExist(
        job.datafeed_config.indices[0],
        job.datafeed_config.query,
        relevantDetectors.map(f => f[fieldName]),
        0,
        job.data_description.time_field
      );

      relevantDetectors.forEach((d) => {
        const field = _.find(stats.aggregatableExistsFields, { fieldName: d[fieldName] });
        if (typeof field === 'object') {
          if (isInvalid(field.stats.cardinality)) {
            messages.push({
              status: VALIDATION_STATUS.WARNING,
              id: `${type}_field_cardinality`,
              fieldName: d[fieldName]
            });
          }
        } else {
          messages.push({
            status: VALIDATION_STATUS.ERROR,
            id: 'field_not_aggregatable',
            fieldName: d[fieldName]
          });
        }
      });
    }

    return messages;
  };
};

export async function validateCardinality(callWithRequest, job) {
  // validate({ type, isInvalid }) asynchronously returns an array of validation messages
  const validate = validateFactory(callWithRequest, job);

  // check over fields (population analysis)
  const validateOverFields = validate({
    type: 'over',
    isInvalid: cardinality => cardinality < OVER_FIELD_CARDINALITY_THRESHOLD
  });

  // check partition/by fields (multi-metric analysis)
  const validatePartitionFields = validate({
    type: 'partition',
    isInvalid: cardinality => cardinality > PARTITION_FIELD_CARDINALITY_THRESHOLD
  });

  const messages = [
    ...await validateOverFields,
    ...await validatePartitionFields
  ];

  if (messages.length === 0) {
    messages.push({
      status: VALIDATION_STATUS.SUCCESS,
      id: 'success_cardinality'
    });
  }

  return messages;
}
