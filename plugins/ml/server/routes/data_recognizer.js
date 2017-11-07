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

import { callWithRequestFactory } from '../get_client_ml';
import { wrapError } from '../errors';
import { DataRecognizer } from '../models/data_recognizer';


function recognize(callWithRequest, indexPatternTitle) {
  const dr = new DataRecognizer(callWithRequest);
  return dr.findMatches(indexPatternTitle);
}

function getConfigs(callWithRequest, configId) {
  const dr = new DataRecognizer(callWithRequest);
  return dr.getConfigs(configId);
}

function saveConfigItems(callWithRequest, configId, label, request) {
  const dr = new DataRecognizer(callWithRequest);
  return dr.saveDataRecognizerConfig(configId, label, request);
}

export function dataRecognizer(server, commonRouteConfig) {

  server.route({
    method: 'GET',
    path: '/api/ml/data_recognizer/recognize/{indexPatternTitle}',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      const indexPatternTitle = request.params.indexPatternTitle;
      return recognize(callWithRequest, indexPatternTitle)
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/ml/data_recognizer/get_configs/{configId}',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      const configId = request.params.configId;
      return getConfigs(callWithRequest, configId)
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/ml/data_recognizer/save/{configId}',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      const configId = request.params.configId;
      const label = (request.payload) ? request.payload.label : undefined;
      return saveConfigItems(callWithRequest, configId, label, request)
        .then(resp => reply(resp))
        .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });
}
