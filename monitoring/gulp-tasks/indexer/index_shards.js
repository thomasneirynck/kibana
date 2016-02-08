var moment = require('moment');
var _ = require('lodash');
var mergePaths = require('./merge_paths');
var getState = require('./get_state');
var Promise = require('bluebird');

var paths = [
  'state_uuid',
  '<%= prefix %>state',
  '<%= prefix %>primary',
  '<%= prefix %>node',
  '<%= prefix %>relocating_node',
  '<%= prefix %>shard',
  '<%= prefix %>index'
];

module.exports = function (bulks, client, monitoringClient, clusterState) {
  return client.cluster.stats().then(function (stats) {
    return getState(client, clusterState).then(function (state) {
      state.cluster_uuid = state.metadata.cluster_uuid;
      var status = clusterState ? 'green' : stats.status;
      _.set(state, 'status', status);
      var shards = _.reduce(state.routing_table.indices, function (memo, data, index) {
        _.each(data.shards, function (shards) {
          memo = memo.concat(shards);
        });
        return memo;
      }, []);
      return Promise.each(shards, function (shard) {
        var id = [
          state.state_uuid,
          shard.index,
          shard.node ? shard.node : 'unassigned',
          shard.primary ? 'primary' : 'replica',
          shard.shard
        ].join(':');
        shard._id = id;
        shard.state_uuid = state.state_uuid;
        return mergePaths(bulks, monitoringClient, state, paths, 'shards', 'shard.')(shard);
      });
    });
  });
};

