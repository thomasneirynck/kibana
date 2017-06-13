import { wrapEsError } from '../../../lib/error_wrappers';
import { INDEX_NAMES, TYPE_NAMES } from '../../../../common/constants';
import { callWithRequestFactory } from '../../../lib/call_with_request_factory';
import { Pipeline } from '../../../models/pipeline';

function savePipeline(callWithRequest, pipelineId, pipelineBody) {
  return callWithRequest('index', {
    index: INDEX_NAMES.PIPELINES,
    type: TYPE_NAMES.PIPELINES,
    id: pipelineId,
    body: pipelineBody,
    refresh: 'wait_for'
  });
}

export function registerSaveRoute(server) {
  server.route({
    path: '/api/logstash/pipeline/{id}',
    method: 'PUT',
    handler: (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);
      const pipeline = Pipeline.fromDownstreamJSON(request.payload);
      return savePipeline(callWithRequest, pipeline.id, pipeline.upstreamJSON)
      .then(reply)
      .catch(e => reply(wrapEsError(e)));
    }
  });
}
