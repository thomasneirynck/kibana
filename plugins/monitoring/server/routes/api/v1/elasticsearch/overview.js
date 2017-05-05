import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStatus } from '../../../../lib/cluster/get_cluster_status';
import { calculateClusterShards } from '../../../../lib/cluster/calculate_cluster_shards';
import { getLastRecovery } from '../../../../lib/elasticsearch/get_last_recovery';
import { getLastState } from '../../../../lib/elasticsearch/get_last_state';
import { getShardStats } from '../../../../lib/elasticsearch/get_shard_stats';
import { getMetrics } from '../../../../lib/details/get_metrics';

// manipulate cluster status and license meta data
export function clustersRoutes(server) {
  /**
   * Elasticsearch Overview
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch',
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
      const config = server.config();
      const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

      return getLastState(req, esIndexPattern)
      .then(lastState => {
        return Promise.props({
          clusterStatus: getClusterStatus(req, esIndexPattern, lastState),
          metrics: getMetrics(req, esIndexPattern),
          shardStats: getShardStats(req, esIndexPattern, lastState),
          shardActivity: getLastRecovery(req, esIndexPattern)
        });
      })
      .then(calculateClusterShards)
      .then(reply)
      .catch(() => reply([]));
    }
  });
};
