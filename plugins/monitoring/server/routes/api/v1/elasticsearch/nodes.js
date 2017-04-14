import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStatus } from '../../../../lib/get_cluster_status';
import { getNodes } from '../../../../lib/lists/get_nodes';
import { getShardStats } from '../../../../lib/get_shard_stats';
import { calculateIndices } from '../../../../lib/calculate_indices';
import { calculateClusterShards } from '../../../../lib/elasticsearch/calculate_cluster_shards';
import { calculateNodeType } from '../../../../lib/calculate_node_type';
import { getLastState } from '../../../../lib/get_last_state';
import { getDefaultNodeFromId } from '../../../../lib/get_default_node_from_id';
import { nodeTypeLabel, nodeTypeClass } from '../../../../lib/lookups';
import { handleError } from '../../../../lib/handle_error';

export function nodesRoutes(server) {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

  function getNodeTypeClassLabel(node) {
    const nodeType = (node.master && 'master') || node.type;
    const typeClassLabel = {
      nodeType,
      nodeTypeLabel: _.get(nodeTypeLabel, nodeType),
      nodeTypeClass: _.get(nodeTypeClass, nodeType)
    };
    return typeClassLabel;
  }

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/nodes',
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
          listingMetrics: Joi.array().required()
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
            listing: getNodes(req, indices),
            shardStats: getShardStats(req, indices, lastState),
            clusterState: lastState
          });
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        body.nodes = body.listing.nodes;
        body.rows = body.listing.rows;
        const clusterState = body.clusterState && body.clusterState.cluster_state || { nodes: {} };
        body.rows.forEach((row) => {
          const resolver = row.name;
          const shardStats = body.shardStats.nodes[resolver];
          let node = body.nodes[resolver];

          // Add some extra metrics
          row.metrics.shard_count = shardStats && shardStats.shardCount || 0;
          row.metrics.index_count = shardStats && shardStats.indexCount || 0;

          // copy some things over from nodes to row
          row.resolver = resolver;
          row.online = !_.isUndefined(clusterState.nodes[row.resolver]);
          if (!node) {
            // workaround for node indexed with legacy agent
            node = getDefaultNodeFromId(resolver);
          }
          node.type = calculateNodeType(node, clusterState);
          row.node = node;
          delete row.name;

          // set type for labeling / iconography
          const { type, typeLabel, typeClass } = getNodeTypeClassLabel(row.node);
          row.node.type = type;
          row.node.nodeTypeLabel = typeLabel;
          row.node.nodeTypeClass = typeClass;
        });
        delete body.listing;
        delete body.clusterState;
        return body;
      })
      // Send the response
      .then(calculateClusterShards)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

};
