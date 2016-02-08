var moment = require('moment');
var _ = require('lodash');
var mergePaths = require('./merge_paths');
var getState = require('./get_state');
var fakeIndicesStats = require('./fake_indices_stats');

var paths = [
  '<%= prefix %>_all.primaries.docs.count',
  '<%= prefix %>_all.primaries.store.size_in_bytes',
  '<%= prefix %>_all.primaries.indexing.index_total',
  '<%= prefix %>_all.primaries.indexing.index_time_in_millis',
  '<%= prefix %>_all.primaries.indexing.is_throttled',
  '<%= prefix %>_all.primaries.indexing.throttle_time_in_millis',
  '<%= prefix %>_all.primaries.search.query_total',
  '<%= prefix %>_all.primaries.search.query_time_in_millis',
  '<%= prefix %>_all.total.docs.count',
  '<%= prefix %>_all.total.store.size_in_bytes',
  '<%= prefix %>_all.total.indexing.index_total',
  '<%= prefix %>_all.total.indexing.index_time_in_millis',
  '<%= prefix %>_all.total.indexing.is_throttled',
  '<%= prefix %>_all.total.indexing.throttle_time_in_millis',
  '<%= prefix %>_all.total.search.query_total',
  '<%= prefix %>_all.total.search.query_time_in_millis',
];

module.exports = function (bulks, client, monitoringClient, clusterState) {
  return getState(client, clusterState).then(function (state) {
    return client.indices.stats()
      .then(function (stats) {
        if (clusterState) return fakeIndicesStats(stats, clusterState);
        return stats;
      })
      .then(mergePaths(bulks, monitoringClient, state, paths, 'indices_stats', 'indices_stats.'));
  });
};

