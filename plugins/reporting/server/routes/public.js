module.exports = function (server) {
  const boom = require('boom');
  const esErrors = server.plugins.elasticsearch.errors;
  const generatePDFStream = server.plugins.reporting.generatePDFStream;

  const mainEntry = '/api/reporting/generate';

  // defined the public routes
  server.route({
    path: `${mainEntry}/visualization/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('visualization', request, reply),
  });

  server.route({
    path: `${mainEntry}/search/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('search', request, reply),
  });

  server.route({
    path: `${mainEntry}/dashboard/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('dashboard', request, reply),
  });

  function pdfHandler(type, request, reply) {
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
