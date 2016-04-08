var mergePaths = require('./merge_paths');
var fakeIndexStats = require('./fake_index_stats');
var Promise = require('bluebird');
var getState = require('./get_state');

var paths = [
  '<%= prefix %>index',
  '<%= prefix %>total.docs.count',
  '<%= prefix %>total.store.size_in_bytes',
  '<%= prefix %>total.store.throttle_time_in_millis',
  '<%= prefix %>total.indexing.throttle_time_in_millis',
  '<%= prefix %>total.indexing.index_total',
  '<%= prefix %>total.indexing.index_time_in_millis',
  '<%= prefix %>total.search.query_total',
  '<%= prefix %>total.search.query_time_in_millis',
  '<%= prefix %>primaries.docs.count',
  '<%= prefix %>total.merges.total_size_in_bytes',
  '<%= prefix %>total.store.size_in_bytes',
  '<%= prefix %>total.segments.memory_in_bytes',
  '<%= prefix %>total.refresh.total_time_in_millis',
  '<%= prefix %>total.fielddata.memory_size_in_bytes'
];

module.exports = function (bulks, client, monitoringClient, clusterState) {
  return getState(client, clusterState).then(function (state) {
    return client.indices.stats().then(function (stats) {
      if (clusterState) {
        stats = fakeIndexStats(stats, clusterState);
      }
      return Promise.each(Object.keys(stats.indices), function (id) {
        var indexStats = stats.indices[id];
        if (indexStats) {
          indexStats.index = id;
          return mergePaths(bulks, monitoringClient, state, paths, 'index_stats', 'index_stats.')(indexStats);
        }
      });
    });
  });
};



