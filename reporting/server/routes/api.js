module.exports = function (server) {
  // var services = Private(require('ui/saved_objects/saved_object_registry')).byLoaderPropertiesName;
  var config = server.config();
  var client = server.plugins.elasticsearch.client;
  var esErrors = server.plugins.elasticsearch.errors;
  var savedObjects = require('../lib/saved_objects')(config, client);

  var handleError = function (reply) {
    return function (err) {
      if (err instanceof esErrors.NotFound) return reply('not found').code(404);
      reply(err);
    };
  };

  server.route({
    path: '/app/reporting/api/visualization/{visId}',
    method: 'GET',
    handler: function (request, reply) {
      var dashId = request.params.visId;

      var panels = savedObjects.dashboardPanels(dashId)
      .then(function (body) {
        return reply({
          dashboard: dashId,
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
      var dashId = request.params.dashboardId;

      var panels = savedObjects.dashboardPanels(dashId)
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
