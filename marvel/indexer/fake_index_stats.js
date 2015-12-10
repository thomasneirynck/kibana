var _ = require('lodash');
var randomizeStat = require('./randomize_stat');

module.exports = function (stats, clusterState) {
  var indiceStats = { cluster_uuid: clusterState.metadata.cluster_uuid, indices: {} };

  var paths = [
    'total.docs.count',
    'total.store.size_in_bytes',
    'total.store.throttle_time_in_millis',
    'total.indexing.throttle_time_in_millis',
    'total.indexing.index_total',
    'total.indexing.index_time_in_millis',
    'total.search.query_total',
    'total.search.query_time_in_millis',
    'primaries.docs.count',
    'total.merges.total_size_in_bytes',
    'total.store.size_in_bytes',
    'total.segments.memory_in_bytes',
    'total.refresh.total_time_in_millis',
    'total.fielddata.memory_size_in_bytes'
  ];

  var indices = _.filter(_.keys(stats.indices), function (index) {
    return /\d{4}\.\d{2}\.\d{2}/.test(index);
  });

  _.each(_.keys(clusterState.routing_table.indices), function (index) {
    var baseIndex = indices.pop();
    if (baseIndex) {
      var stat = _.cloneDeep(stats.indices[baseIndex]);
      var rand = randomizeStat.bind(null, stat);
      paths.forEach(function (path) {
        rand(path, true);
      });
      indiceStats.indices[index] = stat;
      indices.unshift(baseIndex);
    }
  });

  return indiceStats;
};
