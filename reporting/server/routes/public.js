module.exports = function (server) {
  const fs = require('fs');
  const debug = require('../lib/logger');
  const config = server.config();
  const client = server.plugins.reporting.client;
  const esErrors = server.plugins.elasticsearch.errors;

  // init saved objects module
  const savedObjects = require('../lib/saved_objects')(client, config);

  // init the screenshot module
  const phantomSettings = config.get('reporting.phantom');
  const workingDir = config.get('reporting.workingDir');
  const screenshot = require('../lib/screenshot')(phantomSettings, workingDir);

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

      return savedObjects.visualization(visId)
      .then(function (vis) {
        const visUrl = vis.getUrl(request.query);
        debug('visualization found: ' + visUrl);

        return screenshot.capture(visUrl, {
          bounding: {
            left: 363,
            scrollbar: 0,
            footer: 26
          },
          headers: {
            Authorization: request.headers.authorization,
          }
        })
        .then(function (filename) {
          return reply(fs.createReadStream(filename));
        })
        .catch(function (err) {
          reply(err).code(500);
        });

        // inject into PDF
        // export PDF
      })
      .catch(handleError(reply));
    }
  });
};
