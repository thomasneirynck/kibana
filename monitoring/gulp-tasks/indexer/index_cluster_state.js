var moment = require('moment');
var _ = require('lodash');
var mergePaths = require('./merge_paths');
var getState = require('./get_state');

var paths = [
  'cluster_uuid',
  '<%= prefix %>state_uuid',
  '<%= prefix %>version',
  '<%= prefix %>nodes',
  '<%= prefix %>master_node',
  '<%= prefix %>shards',
  '<%= prefix %>status'
];

module.exports = function (bulks, client, monitoringClient, clusterState) {
  return client.cluster.stats().then(function (stats) {
    return getState(client, clusterState).then(function (source) {
      source.cluster_uuid = source.metadata.cluster_uuid;
      var status = clusterState ? 'green' : stats.status;
      _.set(source, 'status', status);
      _.each(source.nodes, function (node, id) {
        var timestamp = moment.utc();
        node.id = id;
        var nodeBody = {
          timestamp: timestamp.toISOString(),
          cluster_uuid: source.metadata.cluster_uuid,
          state_uuid: source.state_uuid,
          node: node
        };
        bulks.push({
          create: {
            _index: timestamp.format('[.monitoring-es-1-]YYYY.MM.DD'),
            _type: 'nodes'
          }
        });
        bulks.push(nodeBody);
        bulks.push({
          create: {
            _index: '.monitoring-es-data-1',
            _type: 'node',
            _id: id
          }
        });
        bulks.push(nodeBody);
      });
      return mergePaths(bulks, monitoringClient, source, paths, 'cluster_state', 'cluster_state.')(source);
    });
  });
};
