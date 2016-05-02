const Promise = require('bluebird');
const _ = require('lodash');
const Joi = require('joi');
const calculateIndices = require('../../../lib/calculate_indices');
const getClusters = require('../../../lib/get_clusters');
const getClustersStats = require('../../../lib/get_clusters_stats');
const getClustersHealth = require('../../../lib/get_clusters_health');
const getLastState = require('../../../lib/get_last_state');
const getClusterStatus = require('../../../lib/get_cluster_status');
const getMetrics = require('../../../lib/get_metrics');
const getShardStats = require('../../../lib/get_shard_stats');
const getLastRecovery = require('../../../lib/get_last_recovery');
const calculateClusterStatus = require('../../../lib/calculate_cluster_status');
const handleError = require('../../../lib/handle_error');

module.exports = (server) => {
  const config = server.config();
  const callWithRequest = server.plugins.monitoring.callWithRequest;

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters',
    config: {
      validate: {
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      return calculateIndices(req, start, end)
      .then(indices => {
        return getClusters(req, indices)
        .then(getClustersStats(req))
        .then(getClustersHealth(req))
        .then(clusters => reply(_.sortBy(clusters, 'cluster_name')));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}',
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
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            metrics: getMetrics(req, indices),
            shardStats: getShardStats(req, indices, lastState),
            shardActivity: getLastRecovery(req, indices)
          });
        });
      })
      .then(calculateClusterStatus)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/info',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        })
      }
    },
    handler: (req, reply) => {
      const params = {
        index: config.get('xpack.monitoring.index'),
        meta: 'route-cluster_info',
        type: 'cluster_info',
        id: req.params.clusterUuid
      };
      return callWithRequest(req, 'get', params)
      .then(resp => reply(resp._source))
      .catch(err => reply(handleError(err, req)));
    }
  });
};
