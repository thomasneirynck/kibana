var _ = require('lodash');

function totalIndices(state) {
  return _.keys(state.routing_table.indices).length;
}

function calculateFactor(stats, state) {
  var indexCount = _.keys(stats.indices).length;
  if (!indexCount) return 1;
  var fakeIndexCount = totalIndices(state);
  if (!fakeIndexCount) return 1;
  return (indexCount / fakeIndexCount);
}

function scaleStat(stats, factor, path) {
  var val = _.get(stats, path);
  _.set(stats, path, val / factor);
}

module.exports = function (stats, clusterState) {

  var paths = [
    '_all.primaries.docs.count',
    '_all.primaries.store.size_in_bytes',
    '_all.primaries.indexing.index_total',
    '_all.primaries.indexing.index_time_in_millis',
    '_all.primaries.indexing.throttle_time_in_millis',
    '_all.primaries.search.query_total',
    '_all.primaries.search.query_time_in_millis',
    '_all.total.docs.count',
    '_all.total.store.size_in_bytes',
    '_all.total.indexing.index_total',
    '_all.total.indexing.index_time_in_millis',
    '_all.total.indexing.throttle_time_in_millis',
    '_all.total.search.query_total',
    '_all.total.search.query_time_in_millis',
  ];

  var factor = calculateFactor(stats, clusterState);
  var scale = scaleStat.bind(null, stats, factor);
  paths.forEach(scale);
  return stats;
};

