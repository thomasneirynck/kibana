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

import { DataVisualizer } from '../data_visualizer';

import { validateJobObject } from './validate_job_object';

// Thresholds to determine whether cardinality is
// too high or low for certain fields analysis
const OVER_FIELD_CARDINALITY_THRESHOLD_LOW = 10;
const OVER_FIELD_CARDINALITY_THRESHOLD_HIGH = 1000000;
const PARTITION_FIELD_CARDINALITY_THRESHOLD = 1000;
const BY_FIELD_CARDINALITY_THRESHOLD = 1000;

const validateFactory = (callWithRequest, job) => {
  const dv = new DataVisualizer(callWithRequest);

  return async ({ type, isInvalid, messageId }) => {
    const messages = [];
    const fieldName = `${type}_field_name`;

    const detectors = job.analysis_config.detectors;
    const relevantDetectors = _.filter(detectors, (detector) => {
      return typeof detector[fieldName] !== 'undefined';
    });

    if (relevantDetectors.length > 0) {
      const stats = await dv.checkAggregatableFieldsExist(
        job.datafeed_config.indices.join(','),
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
              id: messageId || `cardinality_${type}_field`,
              fieldName: d[fieldName]
            });
          }
        } else {
          messages.push({
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
  validateJobObject(job);

  // find out if there are any relevant detector field names
  // where cardinality checks could be run against.
  const numDetectorsWithFieldNames = job.analysis_config.detectors.filter((d) => {
    return (d.by_field_name || d.over_field_name || d.partition_field_name);
  });
  if (numDetectorsWithFieldNames.length === 0) {
    return Promise.resolve([]);
  }

  // validate({ type, isInvalid }) asynchronously returns an array of validation messages
  const validate = validateFactory(callWithRequest, job);

  // check over fields (population analysis)
  const validateOverFieldsLow = validate({
    type: 'over',
    isInvalid: cardinality => cardinality < OVER_FIELD_CARDINALITY_THRESHOLD_LOW,
    messageId: 'cardinality_over_field_low'
  });
  const validateOverFieldsHigh = validate({
    type: 'over',
    isInvalid: cardinality => cardinality > OVER_FIELD_CARDINALITY_THRESHOLD_HIGH,
    messageId: 'cardinality_over_field_high'
  });

  // check partition/by fields (multi-metric analysis)
  const validatePartitionFields = validate({
    type: 'partition',
    isInvalid: cardinality => cardinality > PARTITION_FIELD_CARDINALITY_THRESHOLD
  });
  const validateByFields = validate({
    type: 'by',
    isInvalid: cardinality => cardinality > BY_FIELD_CARDINALITY_THRESHOLD
  });

  // we already called the validation functions above,
  // but add "await" only here so they can be run in parallel.
  const messages = [
    ...await validateByFields,
    ...await validateOverFieldsLow,
    ...await validateOverFieldsHigh,
    ...await validatePartitionFields
  ];

  if (messages.length === 0) {
    messages.push({ id: 'success_cardinality' });
  }

  return messages;
}
