import { get } from 'lodash';
import { INVALID_LICENSE } from '../../../common/constants';
import { checkParam } from '../error_missing_required';
import { createQuery } from '../create_query';
import { ElasticsearchMetric } from '../metrics/metric_classes';
import { validateMonitoringLicense } from './validate_monitoring_license';
import { getClustersState } from './get_clusters_state';

/**
 * This will fetch the cluster stats and cluster state as a single object per cluster.
 *
 * @param  {Object} req The incoming user's request
 * @param  {String} esIndexPattern The Elasticsearch index pattern
 * @param  {String} clusterUuid (optional) If not undefined, getClusters will filter for a single cluster
 * @return {Promise} A promise containing an array of clusters.
 */
export function getClustersStats(req, esIndexPattern, clusterUuid) {
  return fetchClusterStats(req, esIndexPattern, clusterUuid)
  // augment older documents (e.g., from 2.x - 5.4) with their cluster_state
  .then(clusters => getClustersState(req, esIndexPattern, clusters));
}

/**
* Query cluster_stats for all the cluster data
*
* @param {Object} req (required) - server request
* @param {String} esIndexPattern (required) - index pattern to use in searching for cluster_stats data
* @param {String} clusterUuid (optional) - if not undefined, getClusters filters for a single clusterUuid
* @return {Promise} Object representing each cluster.
 */
function fetchClusterStats(req, esIndexPattern, clusterUuid) {
  checkParam(esIndexPattern, 'esIndexPattern in getClusters');

  const config = req.server.config();
  // Get the params from the POST body for the request
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const metric = ElasticsearchMetric.getMetricFields();
  const filters = [];

  if (clusterUuid) {
    filters.push({ term: { cluster_uuid: clusterUuid } });
  }

  const params = {
    index: esIndexPattern,
    ignore: [404],
    filterPath: [
      'hits.hits._source.cluster_uuid',
      'hits.hits._source.cluster_name',
      'hits.hits._source.version',
      'hits.hits._source.license',
      'hits.hits._source.cluster_stats',
      'hits.hits._source.cluster_state'
    ],
    body: {
      size: config.get('xpack.monitoring.max_bucket_size'),
      query: createQuery({ type: 'cluster_stats', start, end, metric, filters }),
      collapse: {
        field: 'cluster_uuid'
      },
      sort: { timestamp: { order: 'desc' } }
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(response => {
    const hits = get(response, 'hits.hits', []);

    return hits
    .map(hit => {
      const cluster = get(hit, '_source');

      if (cluster) {
        if (!validateMonitoringLicense(cluster.cluster_uuid, cluster.license)) {
          // "invalid" license allow deleted/unknown license clusters to show in UI
          cluster.license = INVALID_LICENSE;
        }
      }

      return cluster;
    })
    .filter(Boolean);
  });
}
