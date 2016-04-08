import _ from 'lodash';
import getClient from '../../../lib/get_client_shield';
import { wrapError } from '../../../lib/errors';

export default (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/security/v1/mapping/{query}',
    handler(request, reply) {
      return callWithRequest(request, 'indices.getFieldMapping', {
        index: request.params.query,
        fields: '*',
        allowNoIndices: false,
        includeDefaults: true
      })
      .then(reply)
      .catch(_.flow(wrapError, reply));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/fields/{query}',
    handler(request, reply) {
      return callWithRequest(request, 'indices.getFieldMapping', {
        index: request.params.query,
        fields: '*',
        allowNoIndices: false,
        includeDefaults: true
      })
      .then((mappings) => reply(
        _(mappings)
        .map('mappings')
        .map(_.keys)
        .flatten()
        .uniq()
        .value()
      ))
      .catch(_.flow(wrapError, reply));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/index_patterns',
    handler(request, reply) {
      return callWithRequest(request, 'search', {
        index: server.config().get('kibana.index'),
        type: 'index-pattern',
        fields: [],
        body: {
          query: {match_all: {}},
          size: 10000
        }
      })
      .then((response) => reply(_.map(response.hits.hits, '_id')))
      .catch(_.flow(wrapError, reply));
    }
  });
};
