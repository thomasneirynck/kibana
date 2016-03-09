const _ = require('lodash');
const Promise = require('bluebird');

/*
 * @param req: server's request object
 * @return array
 */
module.exports = function getClustersStats(req) {
  const server = req.server;
  const callWithRequest = server.plugins.elasticsearch.callWithRequest;
  const config = server.config();
  return (clusters) => {
    // in case getClusters had no hits and returned undefined
    if (!clusters) return [];
    return Promise.map(clusters, (cluster) => {
      const body = {
        size: 1,
        sort: [ { timestamp: 'desc' } ],
        query: { bool: { filter: {
          term: { cluster_uuid: cluster.cluster_uuid }
        } } }
      };
      const params = {
        index: config.get('monitoring.index_prefix') + '*',
        meta: 'get_clusters_stats',
        ignore: [404],
        type: 'cluster_stats',
        body: body
      };
      return callWithRequest(req, 'search', params)
        .then((resp) => {
          if (resp.hits.total) {
            cluster.stats = _.get(resp.hits.hits[0], '_source.cluster_stats');
          }
          return cluster;
        });
    });
  };
};
