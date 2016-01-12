module.exports = function (server) {
  const fs = require('fs');
  const _ = require('lodash');
  const boom = require('boom');
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

  // defined the public routes
  server.route({
    path: '/app/reporting/visualization/{savedId}',
    method: 'GET',
    handler: screenshotHandler,
  });

  function screenshotHandler(request, reply) {
    const objId = request.params.savedId;
    const query = request.query;
    const headers = {
      authorization: request.headers.authorization
    };

    const screenshot = getScreenshot('visualization', objId, query, headers)
    .then(function (output) {
      const response = reply(output.payload);
      if (output.type) response.type(output.type);
      if (output.headers) _.forEach(output.headers, (value, name) => response.header(name, value));

      return response;
    })
    .catch(function (err) {
      if (err instanceof esErrors.NotFound) return reply(boom.notFound());
      debug(err);
      reply(err);
    });
  }

  function getScreenshot(type, objId, query, headers) {
    const date = new Date().getTime();
    const filename = `report_${date}.pdf`;

    return savedObjects.get(type, objId)
    .then(function (savedObj) {
      const objUrl = savedObj.getUrl(query);

      debug('headers', headers);
      return screenshot.capture(objUrl, _.assign({
        bounding: {
          top: 116,
          left: 362,
          bottom: 8
        }
      }, { headers }))
      .then(function (filename) {
        return _.assign({ filename }, savedObj);
      });
    })
    .then((obj) => createOutput(obj, query.format));
  }

  function createOutput(savedObj, format) {
    if (format === 'png') {
      return {
        payload: fs.createReadStream(savedObj.filename),
        type: 'image/png'
      };
    }

    const filename = `report_${new Date().getTime()}.pdf`;
    const output = pdf.create();
    output.addImage(savedObj.filename, {
      title: savedObj.title,
      description: savedObj.description,
    });

    return {
      payload: output.generate().getStream(),
      // headers: {
      //   'Content-Disposition': `attachment; filename="${filename}"`,
      // },
      type: 'application/pdf',
    };
  }
};
