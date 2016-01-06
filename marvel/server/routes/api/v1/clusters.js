const Promise = require('bluebird');
const _ = require('lodash');
const root = require('requirefrom')('');
const getClustersStats = root('server/lib/get_clusters_stats');
const getClusters = root('server/lib/get_clusters');
const getClustersHealth = root('server/lib/get_clusters_health');
const getShardStatsForClusters = root('server/lib/get_shard_stats_for_clusters');
const getNodesForClusters = root('server/lib/get_nodes_for_clusters');
const Joi = require('joi');

const calculateIndices = root('server/lib/calculate_indices');
const calculateClusterStatus = root('server/lib/calculate_cluster_status');
const getClusterStatus = root('server/lib/get_cluster_status');
const getMetrics = root('server/lib/get_metrics');
const getShardStats = root('server/lib/get_shard_stats');
const getLastRecovery = root('server/lib/get_last_recovery');
const getNodes = root('server/lib/get_nodes');
const handleError = root('server/lib/handle_error');

module.exports = (server) => {
  const config = server.config();
  const callWithRequest = server.plugins.elasticsearch.callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/marvel/v1/clusters',
    handler: (req, reply) => {
      return getClusters(req)
      .then(getClustersStats(req))
      .then(getClustersHealth(req))
      .then(getNodesForClusters(req))
      .then(getShardStatsForClusters(req))
      .then((clusters) => reply(_.sortBy(clusters, 'cluster_uuid')))
      .catch(err => reply(handleError(err)));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/marvel/v1/clusters/{clusterUuid}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      calculateIndices(req, start, end)
      .then((indices) => {
        return Promise.props({
          clusterStatus: getClusterStatus(req, indices),
          metrics: getMetrics(req, indices),
          shardStats: getShardStats(req, indices),
          shardActivity: getLastRecovery(req, indices),
          nodes: getNodes(req, indices),
        });
      })
      .then(calculateClusterStatus)
      .then(reply)
      .catch(err => reply(handleError(err)));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/marvel/v1/clusters/{clusterUuid}/info',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        })
      }
    },
    handler: (req, reply) => {
      const params = {
        index: config.get('marvel.index'),
        type: 'cluster_info',
        id: req.params.clusterUuid
      };
      return callWithRequest(req, 'get', params)
      .then((resp) => reply(resp._source))
      .catch(err => reply(handleError(err)));
    }
  });

};
