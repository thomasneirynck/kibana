var moment = require('moment');
var _ = require('lodash');
var licenseSample = require('./license-sample.json');
var getState = require('./get_state');
var crypto = require('crypto');
function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = function (client, monitoringClient, overrides, clusterState) {
  overrides = overrides || {};
  return client.info().then(function (info) {
    return getState(client, clusterState).then(function (state) {
      return client.cluster.stats().then(function (stats) {
        var doc = {};
        doc.timestamp = moment.utc().toISOString();
        doc.version = info.version.number;
        doc.cluster_name = state.cluster_name;
        doc.cluster_uuid = state.metadata.cluster_uuid;

        doc.license = _.defaults({}, overrides, licenseSample);
        var key = [
          doc.license.status,
          doc.license.uid,
          doc.license.type,
          doc.license.expiry_date_in_millis,
          doc.cluster_uuid
        ].join('');
        doc.license.issued_to = state.cluster_name;
        doc.license.hkey = sha256(key);

        if (stats.nodes.plugins.length === 0) {
          stats.nodes.plugins = [
            {
              name: 'license',
              version: '2.0.0-beta1-SNAPSHOT',
              description: 'Internal Elasticsearch Licensing Plugin',
              jvm: true,
              classname: 'org.elasticsearch.license.plugin.LicensePlugin',
              isolated: false,
              site: false
            },
            {
              name: 'monitoring',
              version: '2.0.0-beta1-SNAPSHOT',
              description: 'Elasticsearch Monitoring',
              jvm: true,
              classname: 'org.elasticsearch.monitoring.MonitoringPlugin',
              isolated: false,
              site: false
            }
          ];
        }
        doc.cluster_stats = stats;


        return monitoringClient.index({
          index: '.monitoring-es-data-1',
          type: 'cluster_info',
          id: doc.cluster_uuid,
          body: doc
        });

      });
    });
  });
};

