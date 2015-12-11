module.exports = function (server) {
  var fs = require('fs');
  var debug = require('../lib/logger');
  var serviceHelper = require('../lib/services');
  var screenshot = require('../lib/screenshot');
  var client = server.plugins.elasticsearch.client;
  var esErrors = server.plugins.elasticsearch.errors;
  var savedObjects = require('../lib/saved_objects')(client);

  var handleError = function (reply) {
    return function (err) {
      if (err instanceof esErrors.NotFound) return reply('not found').code(404);
      reply(err);
    }
  };

  server.route({
    path: '/app/reporting/visualization/{visualizationId}',
    method: 'GET',
    handler: function (request, reply) {
      var visId = request.params.visualizationId;
      return savedObjects.visualization(visId)
      .then(function (vis) {
        debug('visualization found: ' + vis.url);

        return screenshot.capture(vis.url, {
          left: 363,
          scrollbar: 0,
          footer: 26
        })
        .then(function (filename) {
          reply(fs.createReadStream(filename));
        });

        // inject into PDF
        // export PDF
      })
      .catch(handleError(reply));
    }
  });

  server.route({
    path: '/app/reporting/search/{searchId}',
    method: 'GET',
    handler: function (request, reply) {
      var searchId = request.params.searchId;
      return savedObjects.search(searchId)
      .then(function (search) {
        debug('search found: ' + search.url);

        var filename = screenshot.capture(search.url, {
          left: 330,
          scrollbar: 15
        });
        reply(filename);

        // inject into PDF
        // export PDF
      })
      .catch(handleError(reply));
    }
  });

  server.route({
    path: '/app/reporting/dashboard/{dashboardId}',
    method: 'GET',
    handler: function (request, reply) {
      var dashId = request.params.dashboardId;
      reply('TODO: fetch dash ' + dashId);

      // fetch panels
      // iterate, fetching vis and search images
      // inject into PDF
      // export PDF
    }
  });
}
