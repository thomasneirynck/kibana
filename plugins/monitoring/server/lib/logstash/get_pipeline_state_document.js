import { createQuery } from '../create_query';
import { ElasticsearchMetric } from '../metrics/metric_classes';
import { get } from 'lodash';

export async function getPipelineStateDocument(callWithRequest, req, logstashIndexPattern, start, end, pipelineName, pipelineHash) {
  const filters = [
    { term: { 'logstash_state.pipeline.name': pipelineName } },
    { term: { 'logstash_state.pipeline.hash': pipelineHash } }
  ];
  const query = createQuery({
    type: 'logstash_state',
    start,
    end,
    metric: ElasticsearchMetric.getMetricFields(),
    filters
  });

  const params = {
    index: logstashIndexPattern,
    size: 1,
    body: {
      sort: { timestamp: { order: 'desc' } },
      query: query,
    },
  };

  const resp = await callWithRequest(req, 'search', params);

  // Return null if doc not found
  return get(resp, 'hits.hits[0]._source', null);
}
