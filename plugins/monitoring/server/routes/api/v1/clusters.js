const Promise = require('bluebird');
const _ = require('lodash');
const Joi = require('joi');
const calculateIndices = require('../../../lib/calculate_indices');
const getClusters = require('../../../lib/get_clusters');
const getClustersStats = require('../../../lib/get_clusters_stats');
const getClustersHealth = require('../../../lib/get_clusters_health');
const getKibanasForClusters = require('../../../lib/get_kibanas_for_clusters');
const calculateOverallStatus = require('../../../lib/calculate_overall_status');
const getLastState = require('../../../lib/get_last_state');
const getClusterStatus = require('../../../lib/get_cluster_status');
const getMetrics = require('../../../lib/get_metrics');
const getShardStats = require('../../../lib/get_shard_stats');
const getLastRecovery = require('../../../lib/get_last_recovery');
const calculateClusterStatus = require('../../../lib/elasticsearch/calculate_cluster_status');
const handleError = require('../../../lib/handle_error');

// manipulate cluster status
function normalizeClustersData(clusters) {
  clusters.forEach(cluster => {
    cluster.elasticsearch = {
      status: cluster.status,
      stats: cluster.stats,
      nodes: cluster.nodes,
      indices: cluster.indices
    };
    cluster.status = calculateOverallStatus([
      cluster.elasticsearch.status,
      cluster.kibana && cluster.kibana.status || null
    ]);
    delete cluster.stats;
    delete cluster.nodes;
    delete cluster.indices;
  });
  return clusters;
}

module.exports = (server) => {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_prefix') + '*';
  const kbnIndexPattern = config.get('xpack.monitoring.kibana.index_prefix') + '*';
  const callWithRequest = server.plugins.monitoring.callWithRequest;

  /*
   * Monitoring Home, Route Init
   */
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
      return Promise.all([
        calculateIndices(req, start, end, esIndexPattern),
        calculateIndices(req, start, end, kbnIndexPattern)
      ])
      .then(([esIndices, kibanaIndices]) => {
        return getClusters(req, esIndices)
        .then(getClustersStats(req))
        .then(getClustersHealth(req))
        .then(clusters => {
          const mapClusters = getKibanasForClusters(req, kibanaIndices, 'route-clusters');
          return mapClusters(clusters)
          .then(kibanas => {
            // add the kibana data to each cluster
            kibanas.forEach(kibana => {
              const clusterIndex = _.findIndex(clusters, { cluster_uuid: kibana.clusterUuid });
              _.set(clusters[clusterIndex], 'kibana', kibana.stats);
            });
            return clusters;
          });
        })
        .then(clusters => normalizeClustersData(clusters))
        .then(clusters => reply(_.sortBy(clusters, 'cluster_name')));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });

  /*
   * Elasticsearch Overview
   */
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
      calculateIndices(req, start, end, esIndexPattern)
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

  /*
   * Phone Home
   */
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
      .then(resp => {
        const fields = [
          'cluster_uuid',
          'timestamp',
          'cluster_name',
          'version',
          'license',
          'cluster_stats'
        ];
        const info = _.pick(resp._source, fields);
        const usage = _.set({}, 'stack_stats.xpack', _.get(req, 'server.plugins.xpack_main.usage'));
        reply(_.merge(info, usage));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });
};
