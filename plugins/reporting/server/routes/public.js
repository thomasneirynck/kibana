const boom = require('boom');
const { has } = require('lodash');
const { API_BASE_URL } = require('../lib/constants');
const createDocumentJobFactory = require('../lib/create_document_job');
const { JOBTYPES } = require('../lib/constants');
const licensePreFactory = require ('../lib/license_pre_routing');
const userPreRoutingFactory = require('../lib/user_pre_routing');
const jobResponseHandlerFactory = require('../lib/job_response_handler');

const mainEntry = `${API_BASE_URL}/generate`;
const API_TAG = 'api';

module.exports = function (server) {
  const config = server.config();
  const DOWNLOAD_BASE_URL = config.get('server.basePath') + `${API_BASE_URL}/jobs/download`;
  const socketTimeout = config.get('xpack.reporting.generate.socketTimeout');

  const esErrors = server.plugins.elasticsearch.errors;

  const createDocumentJob = createDocumentJobFactory(server);
  const licensePre = licensePreFactory(server);
  const userPreRouting = userPreRoutingFactory(server);
  const jobResponseHandler = jobResponseHandlerFactory(server);

  function getConfig() {
    return {
      timeout: { socket: socketTimeout },
      tags: [API_TAG],
      pre: [ userPreRouting, licensePre ],
    };
  };

  // show error about method to user
  server.route({
    path: `${mainEntry}/{p*}`,
    method: 'GET',
    handler: (request, reply) => {
      const err = boom.methodNotAllowed('GET is not allowed');
      err.output.headers.allow = 'POST';
      reply(err);
    },
    config: getConfig(),
  });

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
    const syncResponse = has(request.query, 'sync');

    return createJob(objectType, request)
    .then((job) => {
      if (syncResponse) {
        jobResponseHandler(request, reply, { docId: job.id, jobType }, { sync: true });
      } else {
        // return the queue's job information
        const jobJson = job.toJSON();

        const response = reply({
          path: `${DOWNLOAD_BASE_URL}/${jobJson.id}`,
          job: jobJson,
        });
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
