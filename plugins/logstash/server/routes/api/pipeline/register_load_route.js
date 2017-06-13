import Boom from 'boom';
import { INDEX_NAMES, TYPE_NAMES } from '../../../../common/constants';
import { callWithRequestFactory } from '../../../lib/call_with_request_factory';
import { Pipeline } from '../../../models/pipeline';

function fetchPipeline(callWithRequest, pipelineId) {
  return callWithRequest('get', {
    index: INDEX_NAMES.PIPELINES,
    type: TYPE_NAMES.PIPELINES,
    id: pipelineId,
    _source: [
      'description',
      'version',
      'username',
      'pipeline'
    ]
  });
}

export function registerLoadRoute(server) {
  server.route({
    path: '/api/logstash/pipeline/{id}',
    method: 'GET',
    handler: (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);
      const pipelineId = request.params.id;

      return fetchPipeline(callWithRequest, pipelineId)
      .then((pipelineResponseFromES) => {
        const pipeline = Pipeline.fromUpstreamJSON(pipelineResponseFromES);
        reply({ pipeline });
      })
      .catch((e) => reply(Boom.internal(e)));
    }
  });
}
