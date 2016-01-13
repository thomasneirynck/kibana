module.exports = function (server) {
  const debug = require('../lib/logger');
  const config = server.config();
  const client = server.plugins.reporting.client;
  const esErrors = server.plugins.elasticsearch.errors;
  const savedObjects = require('../lib/saved_objects')(client, {
    'kibanaApp': config.get('reporting.kibanaApp'),
    'kibanaIndex': config.get('kibana.index'),
    'protocol': server.info.protocol,
    'hostname': config.get('server.host'),
    'port': config.get('server.port'),
  });

  const handleError = function (reply) {
    return function (err) {
      if (err instanceof esErrors.NotFound) return reply('not found').code(404);
      reply(err);
    };
  };

  server.route({
    path: '/app/reporting/api/visualization/{visId}',
    method: 'GET',
    handler: function (request, reply) {
      const visId = request.params.visId;
      debug(visId);

      const panels = savedObjects.visualization(visId)
      .then(function (body) {
        return reply({
          vis: visId,
          panels: body
        });
      })
      .catch(handleError(reply));
    }
  });

  server.route({
    path: '/app/reporting/api/panels/{dashboardId}',
    method: 'GET',
    handler: function (request, reply) {
      const dashId = request.params.dashboardId;

      const panels = savedObjects.dashboardPanels(dashId)
      .then(function (body) {
        return reply({
          dashboard: dashId,
          panels: body
        });
      })
      .catch(handleError(reply));
    }
  });
};
