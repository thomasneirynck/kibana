const boom = require('boom');
const createDocumentJobFactory = require('../lib/create_document_job');
const constants = require('../lib/constants');
const licensePreFactory = require ('../lib/license_pre_routing');

module.exports = function (server) {
  const createDocumentJob = createDocumentJobFactory(server);
  const esErrors = server.plugins.elasticsearch.errors;
  const licensePre = licensePreFactory(server);

  const mainEntry = '/api/reporting/generate';

  // defined the public routes
  server.route({
    path: `${mainEntry}/visualization/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('visualization', request, reply),
    config: licensePre()
  });

  server.route({
    path: `${mainEntry}/search/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('search', request, reply),
    config: licensePre()
  });

  server.route({
    path: `${mainEntry}/dashboard/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('dashboard', request, reply),
    config: licensePre()
  });

  function pdfHandler(objectType, request, reply) {
    const createJob = createDocumentJob[constants.JOBTYPES_PRINTABLE_PDF];
    return createJob(objectType, request)
    .then((job) => {
      const response = reply(job.toJSON());
      response.type('application/json');
    })
    .catch((err) => {
      if (err instanceof esErrors['401']) return reply(boom.unauthorized());
      if (err instanceof esErrors['403']) return reply(boom.forbidden('Sorry, you are not authorized to use Reporting'));
      if (err instanceof esErrors['404']) return reply(boom.wrap(err, 404));
      reply(err);
    });
  }
};
