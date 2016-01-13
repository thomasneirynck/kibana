const _ = require('lodash');
const Promise = require('bluebird');
const Joi = require('joi');
const root = require('requirefrom')('');
const getClusterStatus = root('server/lib/get_cluster_status');
const getNodeSummary = root('server/lib/get_node_summary');
const getMetrics = root('server/lib/get_metrics');
const getListing = root('server/lib/get_listing');
const getShardStats = root('server/lib/get_shard_stats');
const getShardAllocation = root('server/lib/get_shard_allocation');
const getNodes = root('server/lib/get_nodes');
const calculateIndices = root('server/lib/calculate_indices');
const calculateClusterStatus = root('server/lib/calculate_cluster_status');
const calculateNodeType = root('server/lib/calculate_node_type');
const getLastState = root('server/lib/get_last_state');
const getDefaultNodeFromId = root('server/lib/get_default_node_from_id');
const lookups = root('server/lib/lookups');
const handleError = root('server/lib/handle_error');

module.exports = (server) => {

  function getNodeTypeClassLabel(node) {
    const nodeType = (node.master && 'master') || node.type;
    const typeClassLabel = {
      nodeType,
      nodeTypeLabel: _.get(lookups, `nodeTypeLabel['${nodeType}']`),
      nodeTypeClass: _.get(lookups, `nodeTypeClass['${nodeType}']`)
    };
    return typeClassLabel;
  }

  server.route({
    method: 'POST',
    path: '/api/marvel/v1/clusters/{clusterUuid}/nodes',
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
      calculateIndices(req, start, end)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            rows: getListing(req, indices, 'nodes'),
            shardStats: getShardStats(req, indices, lastState),
            nodes: getNodes(req, indices, lastState),
            clusterState: lastState,
          });
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        body.rows.forEach((row) => {
          const id = row.name;
          const shardStats = body.shardStats.nodes[id];
          const clusterState = body.clusterState && body.clusterState.cluster_state || { nodes: {} };
          let node = body.nodes[id];

          // Add some extra metrics
          row.metrics.shard_count = shardStats && shardStats.shardCount || 0;
          row.metrics.index_count = shardStats && shardStats.indexCount || 0;

          // copy some things over from nodes to row
          row.id = id;
          delete row.name;
          if (node) {
            row.node = node;
          } else {
            // workaround for node indexed with legacy agent
            row.node = getDefaultNodeFromId(id);
            row.node = calculateNodeType(row.node, clusterState);
          }
          row.offline = !clusterState.nodes[row.id];

          // set type for labeling / iconography
          const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(row.node);
          row.node.type = nodeType;
          row.node.nodeTypeLabel = nodeTypeLabel;
          row.node.nodeTypeClass = nodeTypeClass;
        });
        delete body.clusterState;
        return body;
      })
      // Send the response
      .then(calculateClusterStatus)
      .then(reply)
      .catch(err => reply(handleError(err)));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/marvel/v1/clusters/{clusterUuid}/nodes/{id}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          id: Joi.string().required()
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
      const id = req.params.id;
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      calculateIndices(req, start, end)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            nodeSummary: getNodeSummary(req, indices),
            metrics: getMetrics(req, indices, [{ term: { 'node_stats.node_id': id } }]),
            shards: getShardAllocation(req, indices, [{ term: { 'shard.node': id } }], lastState),
            shardStats: getShardStats(req, indices, lastState),
            nodes: getNodes(req, indices, lastState),
            clusterState: lastState
          });
        });
      })
      .then(calculateClusterStatus)
      .then(function (body) {
        const clusterState = body.clusterState && body.clusterState.cluster_state || { nodes: {} };
        let nodeDetail = body.nodes[id];
        if (!nodeDetail) {
          // workaround for node indexed with legacy agent
          nodeDetail = body.nodes[id] = calculateNodeType(getDefaultNodeFromId(id), clusterState);
        }

        // set type for labeling / iconography
        const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(nodeDetail);
        nodeDetail.type = nodeType;
        nodeDetail.nodeTypeLabel = nodeTypeLabel;
        nodeDetail.nodeTypeClass = nodeTypeClass;

        body.nodeSummary.totalShards = _.get(body, `shardStats.nodes['${id}'].shardCount`);
        body.nodeSummary.indexCount = _.get(body, `shardStats.nodes['${id}'].indexCount`);

        // combine data from different sources into 1 object
        body.nodeSummary = _.merge(body.nodeSummary, nodeDetail);

        body.nodeSummary.status = 'Online';
        // If this node is down
        if (!clusterState.nodes[body.nodeSummary.id]) {
          body.nodeSummary.documents = 'N/A';
          body.nodeSummary.dataSize = 'N/A';
          body.nodeSummary.freeSpace = 'N/A';
          body.nodeSummary.documents = 'N/A';
          body.nodeSummary.indexCount = 'N/A';
          body.nodeSummary.totalShards = 'N/A';
          body.nodeSummary.status = 'Offline';
        }
        delete body.clusterState;

        return body;
      })
      .then(reply)
      .catch(err => reply(handleError(err)));
    }
  });

};
