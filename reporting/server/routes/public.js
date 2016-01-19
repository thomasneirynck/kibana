module.exports = function (server) {
  const fs = require('fs');
  const _ = require('lodash');
  const Promise = require('bluebird');
  const boom = require('boom');
  const debug = require('../lib/logger');
  const pdf = require('../lib/pdf');
  const config = server.config();
  const client = server.plugins.reporting.client;
  const esErrors = server.plugins.elasticsearch.errors;

  // init saved objects module
  const savedObjects = require('../lib/saved_objects')(client, {
    'kibanaApp': config.get('server.basePath') + config.get('reporting.kibanaApp'),
    'kibanaIndex': config.get('kibana.index'),
    'protocol': server.info.protocol,
    'hostname': config.get('server.host'),
    'port': config.get('server.port'),
  });

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
    handler: (request, reply) => pdfHandler('visualization', request, reply),
  });

  server.route({
    path: '/app/reporting/search/{savedId}',
    method: 'GET',
    handler: (request, reply) => pdfHandler('search', request, reply),
  });

  server.route({
    path: '/app/reporting/dashboard/{savedId}',
    method: 'GET',
    handler: (request, reply) => pdfHandler('dashboard', request, reply),
  });

  function pdfHandler(type, request, reply) {
    const pdfOutput = pdf.create();
    const objId = request.params.savedId;
    const query = request.query;
    const headers = {
      authorization: request.headers.authorization
    };

    return getObjectQueue(type, objId)
    .then(function (objectQueue) {
      debug(`${objectQueue.length} item(s) to process`);

      return Promise.map(objectQueue, function (savedObj) {
        return getScreenshot(savedObj, query, headers)
        .then((filename) => _.assign({ filename }, savedObj));
      })
      .then(function (objects) {
        return objects.map(function (object) {
          return pdfOutput.addImage(object.filename, {
            title: object.title,
            description: object.description,
          });
        });
      });
    })
    .then(function () {
      const date = new Date().getTime();
      const filename = `report_${date}.pdf`;

      const response = reply(pdfOutput.generate().getStream());
      response.type('application/pdf');
      // response.header('Content-Disposition', `attachment; filename="${filename}"`);
    })
    .catch(function (err) {
      if (err instanceof esErrors.NotFound) return reply(boom.notFound());
      reply(err);
    });
  }

  function getObjectQueue(type, objId) {
    if (type === 'dashboard') {
      return savedObjects.get(type, objId, [ 'panelsJSON'])
      .then(function (savedObj) {
        const fields = ['id', 'type', 'panelIndex'];
        const panels = JSON.parse(savedObj.panelsJSON);

        return panels.map((panel) => savedObjects.get(panel.type, panel.id));
      });
    }

    return Promise.resolve([ savedObjects.get(type, objId) ]);
  }

  function getScreenshot(savedObj, query, headers) {
    const objUrl = savedObj.getUrl(query);

    return screenshot.capture(objUrl, {
      headers,
      bounding: boundingBoxes[savedObj.type],
    });
  }
};
