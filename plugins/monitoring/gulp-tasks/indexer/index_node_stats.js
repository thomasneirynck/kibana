var _ = require('lodash');
var mergePaths = require('./merge_paths');
var getState = require('./get_state');
var Promise = require('bluebird');
var fakeNodeStats = require('./fake_node_stats');

var paths = [
  '<%= prefix %>node_id',
  '<%= prefix %>node_master',
  '<%= prefix %>mlockall',
  '<%= prefix %>disk_threshold_enabled',
  '<%= prefix %>disk_threshold_watermark_high',
  '<%= prefix %>indices.docs.count',
  '<%= prefix %>indices.store.size_in_bytes',
  '<%= prefix %>indices.store.throttle_time_in_millis',
  '<%= prefix %>indices.indexing.throttle_time_in_millis',
  '<%= prefix %>indices.indexing.index_total',
  '<%= prefix %>indices.indexing.index_time_in_millis',
  '<%= prefix %>indices.search.query_total',
  '<%= prefix %>indices.search.query_time_in_millis',
  '<%= prefix %>indices.segments.count',
  '<%= prefix %>process.cpu',
  '<%= prefix %>process.open_file_descriptors',
  '<%= prefix %>process.max_file_descriptors',
  '<%= prefix %>jvm.uptime_in_millis',
  '<%= prefix %>jvm.mem.heap_max_in_bytes',
  '<%= prefix %>jvm.mem.heap_used_in_bytes',
  '<%= prefix %>jvm.mem.heap_used_percent',
  '<%= prefix %>jvm.gc.collectors.young.collection_count',
  '<%= prefix %>jvm.gc.collectors.young.collection_time_in_millis',
  '<%= prefix %>jvm.gc.collectors.old.collection_count',
  '<%= prefix %>jvm.gc.collectors.old.collection_time_in_millis',
  '<%= prefix %>thread_pool.index.rejected',
  '<%= prefix %>thread_pool.search.rejected',
  '<%= prefix %>thread_pool.bulk.rejected',
  '<%= prefix %>fs.total.total_in_bytes',
  '<%= prefix %>fs.total.free_in_bytes',
  '<%= prefix %>fs.total.available_in_bytes',
  '<%= prefix %>os.load_average'
];

module.exports = function (bulks, client, monitoringClient, clusterState) {
  return getState(client, clusterState).then(function (state) {
    return client.nodes.stats().then(function (stats) {
      if (clusterState) {
        stats = fakeNodeStats(_.first(_.values(stats.nodes)), clusterState);
      }
      return Promise.each(Object.keys(stats.nodes), function (id) {
        var nodeStats = stats.nodes[id];
        nodeStats.node_id = id;
        nodeStats.node_master = state.master_node === id;
        nodeStats.mlockall = false;
        nodeStats.disk_threshold_watermark_high = 90.0;
        nodeStats.disk_threshold_enabled = true;
        return mergePaths(bulks, monitoringClient, state, paths, 'node_stats', 'node_stats.')(nodeStats);
      });
    });
  });
};


