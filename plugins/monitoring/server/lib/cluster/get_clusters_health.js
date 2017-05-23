import { get, find, indexBy } from 'lodash';
import { checkParam } from '../error_missing_required';
import { createTypeFilter } from '../create_query';

/**
 * Augment the {@clusters} with their cluster state's from the {@code response}.
 *
 * @param  {Object} response The response containing each cluster's cluster state
 * @param  {Object} config Used to provide the node resolver
 * @param  {Array} clusters Array of clusters to be augmented
 * @return {Array} Always {@code clusters}.
 */
export function handleResponse(response, config, clusters) {
  const hits = get(response, 'hits.hits', []);

  hits.forEach(hit => {
    const currentCluster = get(hit, '_source', {});

    if (currentCluster) {
      const clusterState = currentCluster.cluster_state;
      const cluster = find(clusters, { cluster_uuid: currentCluster.cluster_uuid });

      if (cluster) {
        cluster.status = get(clusterState, 'status');
        cluster.state_uuid = get(clusterState, 'state_uuid');

        const nodes = get(clusterState, 'nodes', []);
        // FIXME: https://github.com/elastic/x-pack-kibana/issues/69
        cluster.nodes = indexBy(nodes, config.get('xpack.monitoring.node_resolver'));
      }
    }
  });

  return clusters;
}

/**
 * This will attempt to augment the {@code clusters} with the {@code status}, {@code state_uuid}, and {@code nodes} from
 * their corresponding cluster state.
 *
 * If there is no cluster state available for any cluster, then it will be returned without any cluster state information.
 */
export function getClustersHealth(req, esIndexPattern, clusters) {
  checkParam(esIndexPattern, 'esIndexPattern in cluster/getClustersHealth');

  if (clusters.length === 0) {
    return Promise.resolve([]);
  }

  const config = req.server.config();
  const clusterUuids = clusters.map(cluster => cluster.cluster_uuid);

  const params = {
    index: esIndexPattern,
    filterPath: [
      'hits.hits._source.cluster_uuid',
      'hits.hits._source.cluster_state.nodes',
      'hits.hits._source.cluster_state.state_uuid',
      'hits.hits._source.cluster_state.status'
    ],
    body: {
      size: clusterUuids.length,
      query: {
        bool: {
          filter: [
            { ...createTypeFilter('cluster_state') },
            { terms: { 'cluster_uuid': clusterUuids } }
          ]
        }
      },
      collapse: {
        field: 'cluster_uuid'
      },
      sort: { 'timestamp': { order: 'desc' } },
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');

  return callWithRequest(req, 'search', params)
  .then(response => handleResponse(response, config, clusters));
};
