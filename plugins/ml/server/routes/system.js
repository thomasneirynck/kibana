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
import { callWithInternalUserFactory } from '../client/call_with_internal_user_factory';

import { wrapError } from '../client/errors';
import Boom from 'boom';

export function systemRoutes(server, commonRouteConfig) {
  const callWithInternalUser = callWithInternalUserFactory(server);

  function isSecurityDisabled() {
    const xpackMainPlugin = server.plugins.xpack_main;
    const xpackInfo = xpackMainPlugin && xpackMainPlugin.info;
    const securityInfo = xpackInfo && xpackInfo.isAvailable() && xpackInfo.feature('security');

    return (securityInfo && securityInfo.isEnabled() === false);
  }

  function getNodeCount() {
    const filterPath = 'nodes.*.attributes';
    return callWithInternalUser('nodes.info', { filterPath })
      .then((resp) => {
        let count = 0;
        if (typeof resp.nodes === 'object') {
          Object.keys(resp.nodes).forEach((k) => {
            if (resp.nodes[k].attributes !== undefined) {
              if (resp.nodes[k].attributes['ml.enabled'] === 'true') {
                count++;
              }
            }
          });
        }
        return { count };
      });
  }

  server.route({
    method: 'POST',
    path: '/api/ml/_has_privileges',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      if (isSecurityDisabled()) {
        // if xpack.security.enabled has been explicitly set to false
        // return that security is disabled and don't call the privilegeCheck endpoint
        reply({ securityDisabled: true });
      } else {
        const body = request.payload;
        return callWithRequest('ml.privilegeCheck', { body })
          .then(resp => reply(resp))
          .catch(resp => reply(wrapError(resp)));
      }
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/ml/ml_node_count',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      return new Promise((resolve, reject) => {
        if (isSecurityDisabled()) {
          getNodeCount()
            .then(resolve)
            .catch(reject);
        } else {
          // if security is enabled, check that the user has permission to
          // create jobs before calling getNodeCount.
          // getNodeCount uses callWithInternalUser and so could give the user
          // access to more information than they are entitled to.
          const body = {
            cluster: [
              'cluster:admin/xpack/ml/job/put',
              'cluster:admin/xpack/ml/job/open',
              'cluster:admin/xpack/ml/datafeeds/put'
            ]
          };
          callWithRequest('ml.privilegeCheck', { body })
            .then((resp) => {
              if (resp.cluster['cluster:admin/xpack/ml/job/put'] &&
                resp.cluster['cluster:admin/xpack/ml/job/open'] &&
                resp.cluster['cluster:admin/xpack/ml/datafeeds/put']) {
                getNodeCount()
                  .then(resolve)
                  .catch(reject);
              } else {
                // if the user doesn't have permission to create jobs
                // return a 403
                reject(Boom.forbidden());
              }
            })
            .catch(reject);
        }
      })
        .then(resp => reply(resp))
        .catch(error => reply(wrapError(error)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/ml/info',
    handler(request, reply) {
      const callWithRequest = callWithRequestFactory(server, request);
      return callWithRequest('ml.info')
        .then(resp => reply(resp))
        .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });
}
