import { get, find, indexBy } from 'lodash';
import calculateAvailability from './calculate_availability';

module.exports = function (req) {
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  return function (clusters) {
    const bodies = [];
    clusters.forEach((cluster) => {
      bodies.push({
        index: config.get('xpack.monitoring.elasticsearch.index_prefix'),
        type: 'cluster_state'
      });
      bodies.push({
        size: 1,
        sort: { 'timestamp': { order: 'desc' } },
        query: { bool: { filter: {
          term: { 'cluster_uuid': cluster.cluster_uuid }
        } } }
      });
    });
    if (!bodies.length) return Promise.resolve([]);
    const params = {
      index: config.get('xpack.monitoring.elasticsearch.index_prefix'),
      meta: 'get_clusters_health',
      type: 'cluster_state',
      body: bodies
    };
    return callWithRequest(req, 'msearch', params)
    .then(res => {
      res.responses.forEach(resp => {
        const hit = get(resp, 'hits.hits[0]');
        if (resp && resp.hits && resp.hits.total !== 0) {
          const clusterName = get(hit, '_source.cluster_uuid');
          const nodes = get(hit, '_source.cluster_state.nodes');
          const cluster = find(clusters, { cluster_uuid: clusterName });
          cluster.status = get(hit, '_source.cluster_state.status');
          cluster.state_uuid = get(hit, '_source.cluster_state.state_uuid');
          cluster.state_timestamp = get(hit, '_source.timestamp');
          cluster.nodes = indexBy(nodes, config.get('xpack.monitoring.node_resolver'));
        }
      });
      return clusters.filter((cluster) => {
        return calculateAvailability(cluster.state_timestamp);
      });
    });
  };
};
