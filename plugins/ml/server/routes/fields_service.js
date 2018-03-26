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

import { callWithRequestFactory } from '../client/call_with_request_factory';
import { wrapError } from '../client/errors';
import { fieldsServiceProvider } from '../models/fields_service';


function getCardinalityOfFields(callWithRequest, payload) {
  const fs = fieldsServiceProvider(callWithRequest);
  const {
    index,
    types,
    fieldNames,
    query,
    timeFieldName,
    earliestMs,
    latestMs } = payload;
  return fs.getCardinalityOfFields(
    index,
    types,
    fieldNames,
    query,
    timeFieldName,
    earliestMs,
    latestMs);
}

export function fieldsService(server, commonRouteConfig) {

  server.route({
    method: 'POST',
    path: '/api/ml/fields_service/field_cardinality',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      return getCardinalityOfFields(callWithRequest, request.payload)
        .then(resp => reply(resp))
        .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });
}
