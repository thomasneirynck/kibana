import { get, isUndefined } from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStats } from '../../../../lib/cluster/get_cluster_stats';
import { getClusterStatus } from '../../../../lib/cluster/get_cluster_status';
import { calculateClusterShards } from '../../../../lib/cluster/calculate_cluster_shards';
import { getNodes } from '../../../../lib/elasticsearch/get_nodes';
import { getShardStats } from '../../../../lib/elasticsearch/get_shard_stats';
import { calculateNodeType } from '../../../../lib/elasticsearch/calculate_node_type';
import { getNodeTypeClassLabel } from '../../../../lib/elasticsearch/get_node_type_class_label';
import { getDefaultNodeFromId } from '../../../../lib/elasticsearch/get_default_node_from_id';
import { handleError } from '../../../../lib/handle_error';

export function nodesRoutes(server) {
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
      const clusterUuid = req.params.clusterUuid;
      const config = server.config();
      const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

      return getClusterStats(req, esIndexPattern, clusterUuid)
      .then(cluster => {
        return Promise.props({
          cluster,
          clusterStatus: getClusterStatus(cluster),
          listing: getNodes(req, esIndexPattern),
          shardStats: getShardStats(req, esIndexPattern, cluster)
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        const clusterState = get(body, 'cluster.cluster_state', { nodes: {} });

        body.nodes = body.listing.nodes;
        body.rows = body.listing.rows;

        body.rows.forEach((row) => {
          const resolver = row.name;
          const isOnline = !isUndefined(clusterState.nodes[resolver]);
          row.resolver = resolver;
          row.online = isOnline;

          // copy some things over from nodes to row
          let node = body.nodes[resolver];

          const shardStats = get(body.shardStats.nodes, resolver);
          if (isOnline) {
            row.metrics.shard_count = get(shardStats, 'shardCount');
            row.metrics.index_count = get(shardStats, 'indexCount');
          } else {
            // suppress metrics from coming in for offline nodes, because they will be used in table column sorting
            delete row.metrics;
          }

          if (!node) {
            // workaround for node indexed with legacy agent
            node = getDefaultNodeFromId(resolver);
          }
          node.type = calculateNodeType(node, get(clusterState, 'master_node'));
          row.node = node;
          delete row.name;

          // set type for labeling / iconography
          const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(row.node);
          row.node.type = nodeType;
          row.node.nodeTypeLabel = nodeTypeLabel;
          row.node.nodeTypeClass = nodeTypeClass;
        });

        delete body.listing;
        delete body.cluster;

        return body;
      })
      // Send the response
      .then(calculateClusterShards)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

};
