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

  // bounding boxes for various saved object types
  const boundingBoxes = {
    visualization: {
      top: 116,
      left: 362,
      bottom: 8
    },
    search: {
      top: 116,
      left: 230,
      bottom: 0,
      right: 30,
    },
  };

  // defined the public routes
  server.route({
    path: '/app/reporting/visualization/{savedId}',
    method: 'GET',
    handler: (request, reply) => screenshotHandler('visualization', request, reply),
  });

  server.route({
    path: '/app/reporting/search/{savedId}',
    method: 'GET',
    handler: (request, reply) => screenshotHandler('search', request, reply),
  });

  function screenshotHandler(type, request, reply) {
    const objId = request.params.savedId;
    const query = request.query;
    const headers = {
      authorization: request.headers.authorization
    };

    const screenshot = getScreenshot(type, objId, query, headers)
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
      return screenshot.capture(objUrl, {
        headers,
        bounding: boundingBoxes[type],
      })
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
