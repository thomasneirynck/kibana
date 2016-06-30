const _ = require('lodash');
const savedObjectsFactory = require('../lib/saved_objects');
const oncePerServer = require('./once_per_server');

function getObjectQueueFactory(server) {
  const client = server.plugins.elasticsearch.client;
  const config = server.config();
  const requestConfig = _.defaults(config.get('xpack.reporting.kibanaServer'), {
    'kibanaApp': config.get('server.basePath') + config.get('xpack.reporting.kibanaApp'),
    'kibanaIndex': config.get('kibana.index'),
    'protocol': server.info.protocol,
    'hostname': config.get('server.host'),
    'port': config.get('server.port'),
  });

  const savedObjects = savedObjectsFactory(client, requestConfig);

  function formatObject(parent, objects) {
    return Object.assign({
      id: parent.id,
      title: parent.title,
      description: parent.description,
      type: parent.type,
      objects
    });
  }

  return function getObjectQueue(type, objId) {
    if (type === 'dashboard') {
      return savedObjects.get(type, objId, [ 'panelsJSON'])
      .then(function (savedObj) {
        const panels = JSON.parse(savedObj.panelsJSON);

        const panelObjects = panels.map((panel) => {
          return savedObjects.get(panel.type, panel.id)
          .then(function (obj) {
            obj.panelIndex = panel.panelIndex;
            return obj;
          });
        });

        return Promise.all(panelObjects)
        .then((objs) => formatObject(savedObj, objs));
      });
    }

    return Promise.resolve(savedObjects.get(type, objId))
    .then((savedObj) => formatObject(savedObj, [ savedObj ]));
  };
}

module.exports = oncePerServer(getObjectQueueFactory);
