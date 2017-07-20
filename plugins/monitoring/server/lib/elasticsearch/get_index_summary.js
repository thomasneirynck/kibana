import { get } from 'lodash';
import { checkParam } from '../error_missing_required';
import { createQuery } from '../create_query.js';
import { ElasticsearchMetric } from '../metrics/metric_classes';

export function handleResponse(response) {
  const indexStats = get(response, 'hits.hits[0]._source.index_stats');
  const primaries = get(indexStats, 'primaries');
  const total = get(indexStats, 'total');
  return {
    documents: get(primaries, 'docs.count', 0),
    dataSize: {
      primaries: get(primaries, 'store.size_in_bytes', 0),
      total: get(total, 'store.size_in_bytes', 0)
    }
  };
}

export function getIndexSummary(req, esIndexPattern, { clusterUuid, indexUuid, start, end }) {
  checkParam(esIndexPattern, 'esIndexPattern in elasticsearch/getIndexSummary');

  const params = {
    index: esIndexPattern,
    ignore: [404],
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({
        type: 'index_stats',
        start,
        end,
        uuid: clusterUuid,
        metric: ElasticsearchMetric.getMetricFields(),
        filters: [
          { term: { 'index_stats.index': indexUuid } }
        ]
      })
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(handleResponse);
};
