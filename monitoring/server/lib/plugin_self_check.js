const ensureVersions = require('./ensure_versions');

module.exports = function pluginSelfCheck(plugin, server) {
  plugin.status.yellow('Waiting for Elasticsearch');
  var client = server.plugins.elasticsearch.client;

  server.plugins.elasticsearch.status.on('red', () => {
    plugin.status.red(`lost connection to the Elasticsearch monitoring cluster`);
  });

  server.plugins.elasticsearch.status.on('green', () => {
    // check if kibana is minimum supported version
    const {
      isKibanaSupported,
      kibanaVersion,
      monitoringVersion
    } = ensureVersions(plugin);

    if (isKibanaSupported) {
      plugin.status.green('Monitoring index ready');
    } else if (!isKibanaSupported) {
      plugin.status.red(`version ${monitoringVersion} is not supported with Kibana ${kibanaVersion}`);
    }
  });

};
