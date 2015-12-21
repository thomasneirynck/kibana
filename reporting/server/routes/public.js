module.exports = function (server) {
  const fs = require('fs');
  const debug = require('../lib/logger');
  const config = server.config();
  const client = server.plugins.reporting.client;
  const esErrors = server.plugins.elasticsearch.errors;
  const savedObjects = require('../lib/saved_objects')(config, client);
  const screenshot = require('../lib/screenshot')(config);

  const handleError = function (reply) {
    return function (err) {
      if (err instanceof esErrors.NotFound) return reply('not found').code(404);
      reply(err);
    };
  };

  server.route({
    path: '/app/reporting/visualization/{visualizationId}',
    method: 'GET',
    handler: function (request, reply) {
      const visId = request.params.visualizationId;
      debug(request.query);
      return savedObjects.visualization(visId)
      .then(function (vis) {
        const visUrl = vis.getUrl(request.query);
        debug('visualization found: ' + visUrl);

        return screenshot.capture(visUrl, {
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
      const searchId = request.params.searchId;
      return savedObjects.search(searchId)
      .then(function (search) {
        const url = search.getUrl(request.query);
        debug('search found: ' + url);

        const filename = screenshot.capture(url, {
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
      const dashId = request.params.dashboardId;
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
