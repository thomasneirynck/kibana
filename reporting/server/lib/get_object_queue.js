const _ = require('lodash');
module.exports = (server) => {
  const client = server.plugins.elasticsearch.client;
  const config = server.config();
  const requestConfig = _.defaults(config.get('xpack.reporting.kibanaServer'), {
    'kibanaApp': config.get('server.basePath') + config.get('xpack.reporting.kibanaApp'),
    'kibanaIndex': config.get('kibana.index'),
    'protocol': server.info.protocol,
    'hostname': config.get('server.host'),
    'port': config.get('server.port'),
  });

  const savedObjects = require('../lib/saved_objects')(client, requestConfig);

  return function getObjectQueue(type, objId) {
    if (type === 'dashboard') {
      return savedObjects.get(type, objId, [ 'panelsJSON'])
      .then(function (savedObj) {
        const fields = ['id', 'type', 'panelIndex'];
        const panels = JSON.parse(savedObj.panelsJSON);

        return panels.map((panel) => {
          return savedObjects.get(panel.type, panel.id)
          .then(function (obj) {
            obj.panelIndex = panel.panelIndex;
            return obj;
          });
        });
      });
    }

    return Promise.resolve([ savedObjects.get(type, objId) ]);
  };
};
