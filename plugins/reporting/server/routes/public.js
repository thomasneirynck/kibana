const boom = require('boom');
const createDocumentJobFactory = require('../lib/create_document_job');
const constants = require('../lib/constants');

module.exports = function (server) {
  const mainEntry = '/api/reporting/generate';
  const createDocumentJob = createDocumentJobFactory(server);
  const esErrors = server.plugins.elasticsearch.errors;

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

  function pdfHandler(objectType, request, reply) {
    const createJob = createDocumentJob[constants.JOBTYPES_PRINTABLE_PDF];
    return createJob(objectType, request)
    .then((job) => {
      const response = reply(job.toJSON());
      response.type('application/json');
    })
    .catch((err) => {
      if (err instanceof esErrors.NotFound) return reply(boom.notFound());
      reply(err);
    });
  }
};
