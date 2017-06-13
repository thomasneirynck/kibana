import { get } from 'lodash';
import { wrapEsError } from '../../../lib/error_wrappers';
import { callWithRequestFactory } from '../../../lib/call_with_request_factory';
import { INDEX_NAMES } from '../../../../common/constants';
import { PipelineListItem } from '../../../models/pipeline_list_item';

function fetchPipelines(callWithRequest) {
  return callWithRequest('search', {
    index: INDEX_NAMES.PIPELINES,
    ignore: [404],
    _source: [
      'description',
      'last_modified',
      'version',
      'username'
    ]
  });
}

export function registerListRoute(server) {
  server.route({
    path: '/api/logstash/pipelines',
    method: 'GET',
    handler: (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);

      return fetchPipelines(callWithRequest)
      .then((pipelinesResponseFromES) => {

        const pipelinesHits = get(pipelinesResponseFromES, 'hits.hits', []);
        const pipelines = pipelinesHits.map(pipeline => {
          return PipelineListItem.fromUpstreamJSON(pipeline).downstreamJSON;
        });

        reply({ pipelines });

      })
      .catch(e => reply(wrapEsError(e)));
    }
  });
}
