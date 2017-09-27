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

export const ES_FIELD_TYPES = {
  ATTACHMENT: 'attachment',
  BOOLEAN: 'boolean',
  BYTE: 'byte',
  DATE: 'date',
  DOUBLE: ' double',
  FLOAT: 'float',
  GEO_POINT: 'geo_point',
  GEO_SHAPE: 'geo_shape',
  HALF_FLOAT: 'half_float',
  INTEGER: 'integer',
  IP: 'ip',
  KEYWORD: 'keyword',
  LONG: ' long',
  MURMUR3: 'murmur3',
  SCALED_FLOAT: 'scaled_float',
  SHORT: 'short',
  TEXT: 'text',
  TOKEN_COUNT: 'token_count',
  _ID: '_id',
  _SOURCE: '_source',
  _TYPE: '_type'
};

export const KBN_FIELD_TYPES = {
  ATTACHMENT: 'attachment',
  BOOLEAN: 'boolean',
  DATE: 'date',
  GEO_POINT: 'geo_point',
  GEO_SHAPE: 'geo_shape',
  IP: 'ip',
  MURMUR3: 'murmur3',
  NUMBER: 'number',
  STRING: 'string',
  _SOURCE: '_source',
  UNKNOWN: 'unknown',
  CONFLICT: 'conflict',
};

export const ML_JOB_FIELD_TYPES = {
  BOOLEAN: 'boolean',
  DATE: 'date',
  GEO_POINT: 'geo_point',
  IP: 'ip',
  KEYWORD: 'keyword',
  NUMBER: 'number',
  TEXT: 'text'
};

// convert kibana types to ML Job types
// this is needed because kibana types only have string and not text and keyword.
// and we can't use ES_FIELD_TYPES because it has no NUMBER type
export function kbnTypeToMLJobType(field) {
  // Return undefined if not one of the supported data visualizer field types.
  let type = undefined;
  switch (field.type) {
    case KBN_FIELD_TYPES.STRING:
      type = field.aggregatable ? ML_JOB_FIELD_TYPES.KEYWORD : ML_JOB_FIELD_TYPES.TEXT;
      break;
    case KBN_FIELD_TYPES.NUMBER:
      type = ML_JOB_FIELD_TYPES.NUMBER;
      break;
    case KBN_FIELD_TYPES.DATE:
      type = ML_JOB_FIELD_TYPES.DATE;
      break;
    case KBN_FIELD_TYPES.IP:
      type = ML_JOB_FIELD_TYPES.IP;
      break;
    case KBN_FIELD_TYPES.BOOLEAN:
      type = ML_JOB_FIELD_TYPES.BOOLEAN;
      break;
    case KBN_FIELD_TYPES.GEO_POINT:
      type = ML_JOB_FIELD_TYPES.GEO_POINT;
      break;
    default:
      break;
  }

  return type;
}
