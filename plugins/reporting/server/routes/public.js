const boom = require('boom');
const { API_BASE_URL } = require('../lib/constants');
const createDocumentJobFactory = require('../lib/create_document_job');
const { JOBTYPES } = require('../lib/constants');
const licensePreFactory = require ('../lib/license_pre_routing');
const userPreRoutingFactory = require('../lib/user_pre_routing');
const syncJobHandlerFactory = require('../lib/sync_job_handler');

const mainEntry = `${API_BASE_URL}/generate`;
const API_TAG = 'api';

module.exports = function (server) {
  const socketTimeout = server.config().get('xpack.reporting.generate.socketTimeout');
  const esErrors = server.plugins.elasticsearch.errors;
  const createDocumentJob = createDocumentJobFactory(server);
  const licensePre = licensePreFactory(server);
  const userPreRouting = userPreRoutingFactory(server);
  const syncJobHandler = syncJobHandlerFactory(server);

  function getConfig() {
    return {
      timeout: { socket: socketTimeout },
      tags: [API_TAG],
      pre: [ userPreRouting, licensePre ],
    };
  };

  // defined the public routes
  server.route({
    path: `${mainEntry}/visualization/{savedId}`,
    method: 'POST',
    handler: (request, reply) => pdfHandler('visualization', request, reply),
    config: getConfig(),
  });

  server.route({
    path: `${mainEntry}/search/{savedId}`,
    method: 'POST',
    handler: (request, reply) => pdfHandler('search', request, reply),
    config: getConfig(),
  });

  server.route({
    path: `${mainEntry}/dashboard/{savedId}`,
    method: 'POST',
    handler: (request, reply) => pdfHandler('dashboard', request, reply),
    config: getConfig(),
  });

  function pdfHandler(objectType, request, reply) {
    const jobType = JOBTYPES.PRINTABLE_PDF;
    const createJob = createDocumentJob[jobType];
    const syncResponse = request.query.hasOwnProperty('sync');

    return createJob(objectType, request)
    .then((job) => {
      if (syncResponse) {
        syncJobHandler(job.id, jobType, request, reply);
      } else {
        // return the queue's job information
        const response = reply(job.toJSON());
        response.type('application/json');
      }
    })
    .catch((err) => {
      if (err instanceof esErrors['401']) return reply(boom.unauthorized());
      if (err instanceof esErrors['403']) return reply(boom.forbidden('Sorry, you are not authorized to create reports'));
      if (err instanceof esErrors['404']) return reply(boom.wrap(err, 404));
      reply(err);
    });
  }
};
