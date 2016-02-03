module.exports = function (server) {
  const fs = require('fs');
  const _ = require('lodash');
  const Promise = require('bluebird');
  const boom = require('boom');
  const pdf = require('../lib/pdf');
  const config = server.config();
  const esErrors = server.plugins.elasticsearch.errors;
  const generatePDFStream = require('../lib/generate_pdf_stream')(server);

  // defined the public routes
  server.route({
    path: '/api/reporting/visualization/{savedId}',
    method: 'GET',
    handler: (request, reply) => pdfHandler('visualization', request, reply),
  });

  server.route({
    path: '/api/reporting/search/{savedId}',
    method: 'GET',
    handler: (request, reply) => pdfHandler('search', request, reply),
  });

  server.route({
    path: '/api/reporting/dashboard/{savedId}',
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

    return generatePDFStream(type, objId, query, headers)
    .then((stream) => {
      const response = reply(stream);
      response.type('application/pdf');
    })
    .catch(function (err) {
      if (err instanceof esErrors.NotFound) return reply(boom.notFound());
      reply(err);
    });
  }

};
