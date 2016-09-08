const boom = require('boom');
const { API_BASE_URL } = require('../lib/constants');
const createDocumentJobFactory = require('../lib/create_document_job');
const { JOBTYPES } = require('../lib/constants');
const licensePreFactory = require ('../lib/license_pre_routing');
const userPreRoutingFactory = require('../lib/user_pre_routing');

const mainEntry = `${API_BASE_URL}/generate`;
const API_TAG = 'api';

module.exports = function (server) {
  const config = server.config();
  const createDocumentJob = createDocumentJobFactory(server);
  const esErrors = server.plugins.elasticsearch.errors;
  const licensePre = licensePreFactory(server);
  const userPreRouting = userPreRoutingFactory(server);

  // defined the public routes
  server.route({
    path: `${mainEntry}/visualization/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('visualization', request, reply),
    config: {
      tags: [API_TAG],
      pre: [ userPreRouting, licensePre ],
    }
  });

  server.route({
    path: `${mainEntry}/search/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('search', request, reply),
    config: {
      tags: [API_TAG],
      pre: [ userPreRouting, licensePre ],
    }
  });

  server.route({
    path: `${mainEntry}/dashboard/{savedId}`,
    method: 'GET',
    handler: (request, reply) => pdfHandler('dashboard', request, reply),
    config: {
      tags: [API_TAG],
      pre: [ userPreRouting, licensePre ],
    }
  });

  function pdfHandler(objectType, request, reply) {
    const jobType = JOBTYPES.PRINTABLE_PDF;
    const createJob = createDocumentJob[jobType];
    const syncResponse = request.query.hasOwnProperty('sync');

    return createJob(objectType, request)
    .then((job) => {
      if (syncResponse) {
        const basePath = config.get('server.basePath') + API_BASE_URL;
        return reply(job.id).redirect(`${basePath}/jobs/download/${job.id}`);
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
