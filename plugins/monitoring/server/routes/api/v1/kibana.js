const Joi = require('joi');
var Promise = require('bluebird');
const handleError = require('../../../lib/handle_error');
const getKibanas = require('../../../lib/get_kibanas');
const getLastState = require('../../..//lib/get_last_state');
const getClusterStatus = require('../../..//lib/get_cluster_status');
const getMetrics = require('../../..//lib/get_metrics');
const getShardStats = require('../../..//lib/get_shard_stats');
const getLastRecovery = require('../../..//lib/get_last_recovery');
const calculateClusterStatus = require('../../..//lib/calculate_cluster_status');
const calculateIndices = require('../../..//lib/calculate_indices');

module.exports = (server) => {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/kibana',
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
      const index = req.server.config().get('xpack.monitoring.kibana_prefix') + '*';
      Promise.all([
        calculateIndices(req, start, end, index),
        calculateIndices(req, start, end)
      ])
      .then(([kibanaIndices, esIndices]) => {
        return getLastState(req, esIndices)
        .then(lastState => {
          return Promise.props({
            kibanas: getKibanas(req, kibanaIndices),
            clusterStatus: getClusterStatus(req, esIndices, lastState),
            shardStats: getShardStats(req, esIndices, lastState),
            shardActivity: getLastRecovery(req, esIndices)
          });
        });
      })
      .then(calculateClusterStatus)
      .then (kibanas => reply(kibanas))
      .catch(err => reply(handleError(err, req)));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/kibana/{kibanaUuid}',
    config: {
      validate: {
        params: Joi.object({
          kibanaUuid: Joi.string().required()
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
      const index = req.server.config().get('xpack.monitoring.kibana_prefix') + '*';
      Promise.all([
        calculateIndices(req, start, end, index),
        calculateIndices(req, start, end)
      ])
      .then(([kibanaIndices, esIndices]) => {
        return getLastState(req, esIndices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, esIndices, lastState),
            metrics: getMetrics(req, kibanaIndices),
            shardStats: getShardStats(req, esIndices, lastState),
            shardActivity: getLastRecovery(req, esIndices)
          });
        });
      })
      .then(calculateClusterStatus)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
