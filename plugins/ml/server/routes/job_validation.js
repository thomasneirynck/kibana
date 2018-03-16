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

import Boom from 'boom';

import { callWithRequestFactory } from '../client/call_with_request_factory';
import { wrapError } from '../client/errors';
import { estimateBucketSpanFactory } from '../models/bucket_span_estimator';
import { validateJob } from '../models/job_validation';

export function jobValidationRoutes(server, commonRouteConfig) {

  server.route({
    method: 'POST',
    path: '/api/ml/validate/estimate_bucket_span',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      try {
        return estimateBucketSpanFactory(callWithRequest)(request.payload)
          .then(reply)
          // this catch gets triggered when the estimation code runs without error
          // but isn't able to come up with a bucket span estimation.
          // this doesn't return a HTTP error but an object with an error message
          // which the client is then handling. triggering a HTTP error would be
          // too severe for this case.
          .catch((resp) => {
            reply({
              error: true,
              message: resp
            });
          });
      // this catch gets triggered when an actual error gets thrown when running
      // the estimation code, for example when the request payload is malformed
      } catch(error) {
        throw Boom.badRequest(error);
      }
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/ml/validate/job',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      return validateJob(callWithRequest, request.payload)
        .then(reply)
        .catch((resp) => {
          reply(wrapError(resp));
        });
    },
    config: {
      ...commonRouteConfig
    }
  });

}
