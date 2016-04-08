var moment = require('moment');
var _ = require('lodash');
var mergePaths = require('./merge_paths');
var getState = require('./get_state');
var fakeClusterStats = require('./fake_cluster_stats');

var paths = [
  'status',
  '<%= prefix %>indices.shards.total',
  '<%= prefix %>indices.shards.index.replication.min',
  '<%= prefix %>indices.count',
  '<%= prefix %>indices.docs.count',
  '<%= prefix %>indices.store.size_in_bytes',
  '<%= prefix %>nodes.count.total',
  '<%= prefix %>nodes.jvm.max_uptime_in_millis',
  '<%= prefix %>nodes.jvm.versions',
  '<%= prefix %>nodes.jvm.mem.heap_used_in_bytes',
  '<%= prefix %>nodes.jvm.mem.heap_max_in_bytes',
  '<%= prefix %>nodes.fs.total_in_bytes',
  '<%= prefix %>nodes.fs.free_in_bytes',
  '<%= prefix %>nodes.fs.available_in_bytes'
];

module.exports = function (bulks, client, monitoringClient, clusterState) {
  return getState(client, clusterState).then(function (state) {
    return client.cluster.stats()
      .then(function (stats) {
        if (clusterState) return fakeClusterStats(stats, clusterState);
        return stats;
      })
      .then(mergePaths(bulks, monitoringClient, state, paths, 'cluster_stats', 'cluster_stats.'));
  });
};

