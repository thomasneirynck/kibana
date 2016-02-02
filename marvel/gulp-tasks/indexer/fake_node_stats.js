var _ = require('lodash');
var randomizeStat = require('./randomize_stat');

module.exports = function (stats, clusterState) {

  var nodeStats = { nodes: {}, cluster_uuid: clusterState.metadata.cluster_uuid };


  _.each(clusterState.nodes, function (node, id) {
    var stat = _.assign(_.cloneDeep(stats), {
      name: node.name,
      master_node: id === clusterState.master_node,
      transport_address: node.transport_address
    });
    var rand = randomizeStat.bind(null, stat);
    rand('indices.docs.count', true);
    rand('indices.store.size_in_bytes', true);
    rand('indices.store.throttle_time_in_millis', true);
    rand('indices.indexing.throttle_time_in_millis', true);
    rand('indices.indexing.index_total', true);
    rand('indices.indexing.index_time_in_millis', true);
    rand('indices.search.query_total', true);
    rand('indices.search.query_time_in_millis', true);
    rand('indices.segments.count', true);
    rand('process.cpu.percent', true);
    rand('process.cpu.total_in_millis', true);
    rand('process.open_file_descriptors', true);
    rand('process.max_file_descriptors', true);
    rand('jvm.uptime_in_millis', true);
    rand('jvm.mem.heap_max_in_bytes', true);
    rand('jvm.mem.heap_used_in_bytes', true);
    rand('jvm.mem.heap_used_percent', true);
    rand('jvm.gc.collectors.young.collection_count', true);
    rand('jvm.gc.collectors.young.collection_time_in_millis', true);
    rand('jvm.gc.collectors.old.collection_count', true);
    rand('jvm.gc.collectors.old.collection_time_in_millis', true);
    rand('thread_pool.index.rejected', true);
    rand('thread_pool.search.rejected', true);
    rand('thread_pool.bulk.rejected', true);
    rand('fs.total.total_in_bytes', true);
    rand('fs.total.free_in_bytes', true);
    rand('fs.total.available_in_bytes', true);
    rand('os.load_average');
    nodeStats.nodes[id] = stat;
  });

  return nodeStats;
};
