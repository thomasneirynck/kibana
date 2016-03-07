import { getDefaultDataObject, processIndexShards } from './process_index_shards';
const _ = require('lodash');
const createQuery = require('./create_query');
const root = require('requirefrom')('');
const calculateNodeType = root('server/lib/calculate_node_type');
const nodeAggVals = root('server/lib/node_agg_vals');

module.exports = (req, indices, lastState) => {
  const config = req.server.config();
  const nodeResolver = config.get('monitoring.node_resolver');
  const callWithRequest = req.server.plugins.elasticsearch.callWithRequest;
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const clusterUuid = req.params.clusterUuid;
  const aggSize = 10;
  const params = {
    index: indices,
    meta: 'get_shard_stats',
    type: 'shards',
    ignore: [404],
    size: 0,
    body: {
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({
        clusterUuid: clusterUuid,
        filters: [ { term: { state_uuid: _.get(lastState, 'cluster_state.state_uuid') } } ]
      }),
      aggs: {
        indices: {
          terms: {
            field: 'shard.index',
            size: config.get('monitoring.max_bucket_size')
          },
          aggs: {
            states: {
              terms: { field: 'shard.state', size: aggSize },
              aggs: { primary: { terms: { field: 'shard.primary', size: aggSize } } }
            }
          }
        },
        nodes: {
          terms: {
            field: `source_node.${nodeResolver}`,
            size: config.get('monitoring.max_bucket_size')
          },
          aggs: {
            index_count: { cardinality: { field: 'shard.index' } },
            node_names: {
              terms: { field: 'source_node.name', size: aggSize },
              aggs: { max_timestamp: { max: { field: 'timestamp' } } }
            },
            node_transport_address: {
              terms: { field: 'source_node.transport_address', size: aggSize },
              aggs: { max_timestamp: { max: { field: 'timestamp' } } }
            },
            node_data_attributes: { terms: { field: 'source_node.attributes.data', size: aggSize } },
            node_master_attributes: { terms: { field: 'source_node.attributes.master', size: aggSize } },
            // for doing a join on the cluster state to determine if node is current master
            node_ids: { terms: { field: 'source_node.uuid', size: aggSize } }
          },
        }
      }
    }
  };

  return callWithRequest(req, 'search', params)
  .then((resp) => {
    const data = getDefaultDataObject();

    // Mutate "data" with a nodes object having a field for every node
    function processNodeShards(bucket) {
      data.nodes[bucket.key] = {
        shardCount: bucket.doc_count,
        indexCount: bucket.index_count.value,
        name: nodeAggVals.getLatestAggKey(bucket.node_names.buckets),
        transport_address: nodeAggVals.getLatestAggKey(bucket.node_transport_address.buckets),
        node_ids: bucket.node_ids.buckets.map(b => b.key),
        attributes: {
          data: nodeAggVals.getNodeAttribute(bucket.node_data_attributes.buckets),
          master: nodeAggVals.getNodeAttribute(bucket.node_master_attributes.buckets)
        }
      };
      data.nodes[bucket.key].resolver = data.nodes[bucket.key][nodeResolver];
    }

    if (resp && resp.hits && resp.hits.total !== 0) {
      resp.aggregations.indices.buckets.forEach(processIndexShards(data));
      resp.aggregations.nodes.buckets.forEach(processNodeShards);
    }

    _.forEach(data.nodes, node => {
      node.type = calculateNodeType(node, lastState.cluster_state);
    });

    return data;

  });
};
