var moment = require('moment');
var _ = require('lodash');
module.exports = function (bulks, client, monitoringClient) {
  var timestamp = moment.utc();
  return client.cluster.state().then(function (clusterState) {
    return client.indices.recovery()
      .then(function (recovery) {
        recovery.cluster_uuid = clusterState.metadata.cluster_uuid;
        var body = {
          cluster_uuid: clusterState.metadata.cluster_uuid,
          timestamp: timestamp.toISOString(),
          index_recovery: {}
        };
        body.index_recovery.shards = _.reduce(recovery, function (accum, details, index) {
          if (details.shards && details.shards.length) {
            return accum.concat(_.map(details.shards, function (row) {
              row.index.name = index;
              return row;
            }));
          } else {
            return accum;
          }
        }, []);
        return body;
      })
      .then(function (body) {
        bulks.push({
          index: {
            _index: timestamp.format('[.monitoring-es-1-]YYYY.MM.DD'),
            _type: 'index_recovery',
          }
        });
        bulks.push(body);
        return bulks;
      });
  });
};
