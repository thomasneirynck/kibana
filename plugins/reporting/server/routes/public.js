var createJobFactory = require('../lib/create_job');
var constants = require('../lib/constants');

module.exports = function (server) {
  const boom = require('boom');
  const esErrors = server.plugins.elasticsearch.errors;
  const createJob = createJobFactory(server);

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

    return createJob(constants.JOBTYPES_PRINTABLE_PDF, type, objId, query, headers)
    .then(function (job) {
      const response = reply(job.toJSON());
      response.type('application/json');
    })
    .catch(function (err) {
      if (err instanceof esErrors.NotFound) return reply(boom.notFound());
      reply(err);
    });
  }
};
