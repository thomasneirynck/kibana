import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { getLastState } from '../../../../lib/get_last_state';
import { getClusterStatus } from '../../../../lib/get_cluster_status';
import { getIndices } from '../../../../lib/lists/get_indices';
import { getShardStats } from '../../../../lib/get_shard_stats';
import { getUnassignedShards } from '../../../../lib/get_unassigned_shards';
import { calculateClusterShards } from '../../../../lib/elasticsearch/calculate_cluster_shards';
import { handleError } from '../../../../lib/handle_error';

export function indicesRoutes(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/indices',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          showSystemIndices: Joi.boolean().default(false), // show/hide indices in listing
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          listingMetrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const showSystemIndices = req.payload.showSystemIndices;
      const config = req.server.config();
      const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

      return getLastState(req, esIndexPattern)
      .then(lastState => {
        return Promise.props({
          clusterStatus: getClusterStatus(req, esIndexPattern, lastState),
          rows: getIndices(req, esIndexPattern, showSystemIndices),
          shardStats: getShardStats(req, esIndexPattern, lastState)
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        body.rows.forEach((row) => {
          if (body.shardStats[row.name]) {
            row.status = body.shardStats[row.name].status;
            // column for a metric that is calculated in code vs. calculated in a query
            // it's not given in req.payload.listingMetrics
            _.merge(row, getUnassignedShards(body.shardStats[row.name]));
          } else {
            row.status = 'Unknown';
            _.set(row, 'metrics.index_document_count.inapplicable', true);
            _.set(row, 'metrics.index_size.inapplicable', true);
            _.set(row, 'metrics.index_search_request_rate.inapplicable', true);
            _.set(row, 'metrics.index_request_rate.inapplicable', true);
            _.set(row, 'metrics.index_unassigned_shards.inapplicable', true);
          }
        });
        return body;
      })
      // Send the response
      .then(calculateClusterShards)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
