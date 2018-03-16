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

export function indicesRoutes(server, commonRouteConfig) {

  server.route({
    method: 'POST',
    path: '/api/ml/field_caps',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      const index = request.payload.index;
      let fields = '*';
      if (request.payload.fields !== undefined && Array.isArray(request.payload.fields)) {
        fields = request.payload.fields.join(',');
      }

      return callWithRequest('fieldCaps', { index, fields })
        .then(resp => reply(resp))
        .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });
}
