module.exports = function (server) {
  var fs = require('fs');
  var debug = require('../lib/logger');
  var config = server.config();
  var client = server.plugins.elasticsearch.client;
  var esErrors = server.plugins.elasticsearch.errors;
  var savedObjects = require('../lib/saved_objects')(config, client);
  var screenshot = require('../lib/screenshot')(config);

  var handleError = function (reply) {
    return function (err) {
      if (err instanceof esErrors.NotFound) return reply('not found').code(404);
      reply(err);
    };
  };

  server.route({
    path: '/app/reporting/visualization/{visualizationId}',
    method: 'GET',
    handler: function (request, reply) {
      var visId = request.params.visualizationId;
      debug(request.query);
      return savedObjects.visualization(visId)
      .then(function (vis) {
        var url = vis.getUrl(request.query);
        debug('visualization found: ' + url);

        return screenshot.capture(url, {
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
        var url = search.getUrl(request.query);
        debug('search found: ' + url);

        var filename = screenshot.capture(url, {
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
      return savedObjects.dashboard(dashId)
      .then(function (dash) {
        console.log(request.query);
        console.log('url', dash.getUrl(request.query));
        reply('TODO: fetch dash ' + dash.title);
      });

      // fetch panels
      // iterate, fetching vis and search images
      // inject into PDF
      // export PDF
    }
  });
};
