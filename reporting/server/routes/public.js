module.exports = function (server) {
  const fs = require('fs');
  const _ = require('lodash');
  const Promise = require('bluebird');
  const debug = require('../lib/logger');
  const pdf = require('../lib/pdf');
  const config = server.config();
  const client = server.plugins.reporting.client;
  const esErrors = server.plugins.elasticsearch.errors;

  // init saved objects module
  const savedObjects = require('../lib/saved_objects')(client, config);

  // init the screenshot module
  const phantomSettings = config.get('reporting.phantom');
  const screenshot = require('../lib/screenshot')(phantomSettings);

  const handleError = function (reply) {
    return function (err) {
      if (err instanceof esErrors.NotFound) return reply('not found').code(404);
      reply(err);
    };
  };

  const createOutput = function (savedObj, format) {
    if (format === 'png') {
      return Promise.resolve({
        payload: fs.createReadStream(savedObj.filename),
        type: 'image/png'
      });
    }

    var output = pdf.create();
    output.addImage(savedObj.filename, {
      title: savedObj.title,
      description: savedObj.description,
    });

    return Promise.resolve({
      payload: output.generate().getStream(),
      type: 'application/pdf',
    });
  };

  server.route({
    path: '/app/reporting/visualization/{visualizationId}',
    method: 'GET',
    handler: function (request, reply) {
      const visId = request.params.visualizationId;
      const date = new Date().getTime();
      const filename = `report_${date}.pdf`;

      return savedObjects.get('visualization', visId)
      .then(function (vis) {
        const visUrl = vis.getUrl(request.query);

        return screenshot.capture(visUrl, {
          bounding: {
            top: 116,
            left: 362,
            bottom: 8
          },
          headers: {
            Authorization: request.headers.authorization,
          }
        })
        .then(function (filename) {
          return _.assign({ filename }, vis);
        })
        .catch(function (err) {
          return reply(err).code(500);
        });
      })
      .then((obj) => createOutput(obj, request.query.format))
      .then(function (output) {
        return reply(null, output.payload)
        // .header('content-disposition', `attachment; filename="${filename}"`)
        .type(output.type);
      })
      .catch(handleError(reply));
    }
  });
};
