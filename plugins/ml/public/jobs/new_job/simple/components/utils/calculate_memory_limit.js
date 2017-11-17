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

// calculates the size of the model memory limit used in the job config
// based on the cardinality of the field being used to split the data.
// the limit should be 10MB plus 20kB per series, rounded up to the nearest MB.
import { FieldsServiceProvider } from 'plugins/ml/services/fields_service';

export function CalculateModelMemoryLimitProvider(Private) {
  const fieldsService = Private(FieldsServiceProvider);

  return function (indexPattern, fieldName, query, timeField, earliestMs, latestMs) {
    return new Promise((resolve, reject) => {
      fieldsService.getCardinalityOfFields(
        indexPattern,
        [],
        [fieldName],
        query,
        timeField,
        earliestMs,
        latestMs
      ).then((resp) => {
        const cardinality = resp[fieldName];
        let mmlKB = 10000;
        const SERIES_MULTIPLIER = 20;

        if (cardinality !== undefined) {
          mmlKB += (SERIES_MULTIPLIER * cardinality);
        }

        const mmlMB = Math.ceil(mmlKB / 1000);
        resolve(`${mmlMB}MB`);
      })
        .catch((error) => {
          reject(error);
        });
    });
  };

}
