var _ = require('lodash');

function totalShards(state) {
  return _.reduce(state.routing_table.indices, function (memo, data) {
    return memo + data.shards.length;
  }, 0);
}

function totalIndices(state) {
  return _.keys(state.routing_table.indices).length;
}

function totalDocs(stats, state) {
  return calculateFactor(stats, state);
}

function calculateFactor(stats, state) {
  var indexCount = _.get(stats, 'indices.count');
  if (!indexCount) return 1;
  var fakeIndexCount = totalIndices(state);
  if (!fakeIndexCount) return 1;
  return (indexCount / fakeIndexCount);
}

function totalSizeInBytes(stats, state) {
  var sizeInBytes = _.get(stats, 'indices.store.size_in_bytes');
  return sizeInBytes / calculateFactor(stats, state);
}

function totalNodes(state) {
  return _.keys(state.nodes).length;
}

module.exports = function (stats, clusterState) {
  if (!clusterState) return stats;
  var fakeStats = _.cloneDeep(stats);
  var usedInBytes = _.get(stats, 'nodes.jvm.mem.heap_used_in_bytes') * totalNodes(clusterState);
  var maxInBytes = _.get(stats, 'nodes.jvm.mem.heap_max_in_bytes') * totalNodes(clusterState);
  _.set(fakeStats, 'indices.shards.total', totalShards(clusterState));
  _.set(fakeStats, 'indices.count', totalIndices(clusterState));
  _.set(fakeStats, 'indices.docs.count', totalDocs(stats, clusterState));
  _.set(fakeStats, 'indices.store.size_in_bytes', totalSizeInBytes(stats, clusterState));
  _.set(fakeStats, 'nodes.count.total', totalNodes(clusterState));
  _.set(fakeStats, 'nodes.jvm.mem.heap_used_in_bytes', usedInBytes);
  _.set(fakeStats, 'nodes.jvm.mem.heap_max_in_bytes', maxInBytes);
  return fakeStats;
};
