import { get, merge } from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStats } from '../../../../lib/cluster/get_cluster_stats';
import { getNodeSummary } from '../../../../lib/elasticsearch/get_node_summary';
import { getDefaultNodeFromId } from '../../../../lib/elasticsearch/get_default_node_from_id';
import { calculateNodeType } from '../../../../lib/elasticsearch/calculate_node_type';
import { getNodeTypeClassLabel } from '../../../../lib/elasticsearch/get_node_type_class_label';
import { getShardStats, getShardAllocation } from '../../../../lib/elasticsearch/shards';
import { getMetrics } from '../../../../lib/details/get_metrics';
import { handleError } from '../../../../lib/handle_error';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

export function nodeRoutes(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/nodes/{resolver}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          resolver: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional(),
          showSystemIndices: Joi.boolean().default(false), // show/hide system indices in shard allocation table
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required(),
          shards: Joi.boolean().default(true)
        })
      }
    },
    handler: (req, reply) => {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const resolver = req.params.resolver;
      const showSystemIndices = req.payload.showSystemIndices;
      const collectShards = req.payload.shards;
      const esIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.elasticsearch.index_pattern', ccs);

      return getClusterStats(req, esIndexPattern, clusterUuid)
      .then(cluster => {
        const configResolver = `source_node.${config.get('xpack.monitoring.node_resolver')}`;
        let shards;
        if (collectShards) {
          shards = getShardAllocation(req, esIndexPattern, [{ term: { [configResolver]: resolver } }], cluster, showSystemIndices);
        }
        return Promise.props({
          nodeSummary: getNodeSummary(req, esIndexPattern),
          metrics: getMetrics(req, esIndexPattern, [{ term: { [configResolver]: resolver } }]),
          shards,
          shardStats: getShardStats(req, esIndexPattern, cluster, { includeIndices: true, includeNodes: true }),
          nodes: {},
          cluster
        });
      })
      .then(body => {
        const clusterState = get(body, 'cluster.cluster_state', { nodes: {} });
        let nodeDetail = body.nodeSummary.node;
        if (!nodeDetail) {
          // workaround for node indexed with legacy agent
          nodeDetail = getDefaultNodeFromId(resolver);
        }
        const calculatedNodeType = calculateNodeType(nodeDetail, get(clusterState, 'master_node'));
        body.nodes[resolver] = nodeDetail;

        // set type for labeling / iconography
        const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(nodeDetail, calculatedNodeType);
        nodeDetail.type = nodeType;
        nodeDetail.nodeTypeLabel = nodeTypeLabel;
        nodeDetail.nodeTypeClass = nodeTypeClass;

        body.nodeSummary.totalShards = get(body, `shardStats.nodes['${resolver}'].shardCount`);
        body.nodeSummary.indexCount = get(body, `shardStats.nodes['${resolver}'].indexCount`);

        // combine data from different sources into 1 object
        body.nodeSummary = merge(body.nodeSummary, nodeDetail);

        body.nodeSummary.status = 'Online';
        // If this node is down
        if (!clusterState.nodes[body.nodeSummary.resolver]) {
          body.nodeSummary.documents = 'N/A';
          body.nodeSummary.dataSize = 'N/A';
          body.nodeSummary.freeSpace = 'N/A';
          body.nodeSummary.documents = 'N/A';
          body.nodeSummary.indexCount = 'N/A';
          body.nodeSummary.totalShards = 'N/A';
          body.nodeSummary.status = 'Offline';
        }
        delete body.clusterState;

        if (collectShards) {
          delete body.shardStats.indicesTotals;
        } else {
          delete body.shardStats; // no shard info needed for advanced view
        }

        return body;
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

}
