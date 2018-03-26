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

// Service for carrying out queries to obtain data
// specific to fields in Elasticsearch indices.

export function FieldsServiceProvider(ml) {

  // Obtains the cardinality of one or more fields.
  // Returns an Object whose keys are the names of the fields,
  // with values equal to the cardinality of the field.
  function getCardinalityOfFields(
    index,
    types,
    fieldNames,
    query,
    timeFieldName,
    earliestMs,
    latestMs) {

    return ml.getCardinalityOfFields({
      index,
      types,
      fieldNames,
      query,
      timeFieldName,
      earliestMs,
      latestMs
    });
  }

  return {
    getCardinalityOfFields
  };
}
