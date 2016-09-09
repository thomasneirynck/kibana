const boom = require('boom');
const { JOBTYPES, API_BASE_URL } = require('../lib/constants');
const jobsQueryFactory = require('../lib/jobs_query');
const licensePreFactory = require ('../lib/license_pre_routing');
const userPreRoutingFactory = require('../lib/user_pre_routing');
const syncJobHandlerFactory = require('../lib/sync_job_handler');

const mainEntry = `${API_BASE_URL}/jobs`;
const API_TAG = 'api';

module.exports = function (server) {
  const socketTimeout = server.config().get('xpack.reporting.queue.syncSocketTimeout');
  const jobsQuery = jobsQueryFactory(server);
  const licensePre = licensePreFactory(server);
  const userPreRouting = userPreRoutingFactory(server);
  const syncJobHandler = syncJobHandlerFactory(server);

  // list jobs in the queue, paginated
  server.route({
    path: `${mainEntry}/list`,
    method: 'GET',
    handler: (request, reply) => {
      const page = parseInt(request.query.page) || 0;
      const size = Math.min(100, parseInt(request.query.size) || 10);

      const results = jobsQuery.list(request, page, size);
      reply(results);
    },
    config: {
      pre: [ licensePre ],
    }
  });

  // list all completed jobs since a specified time
  server.route({
    path: `${mainEntry}/list_completed_since`,
    method: 'GET',
    handler: (request, reply) => {
      const size = Math.min(100, parseInt(request.query.size) || 10);
      const sinceInMs = Date.parse(request.query.since) || null;

      const results = jobsQuery.listCompletedSince(request, size, sinceInMs);
      reply(results);
    },
    config: {
      pre: [ licensePre ],
    }
  });

  // return the count of all jobs in the queue
  server.route({
    path: `${mainEntry}/count`,
    method: 'GET',
    handler: (request, reply) => {
      const results = jobsQuery.count(request);
      reply(results);
    },
    config: {
      pre: [ licensePre ],
    }
  });

  // return the raw output from a job
  server.route({
    path: `${mainEntry}/output/{docId}`,
    method: 'GET',
    handler: (request, reply) => {
      const { docId } = request.params;

      jobsQuery.get(request, docId, true)
      .then((doc) => {
        if (!doc) return reply(boom.notFound());
        reply(doc._source.output);
      });
    },
    config: {
      pre: [ licensePre ],
      timeout: { socket: socketTimeout },
    }
  });

  // trigger a download of the output from a job
  server.route({
    path: `${mainEntry}/download/{docId}`,
    method: 'GET',
    handler: (request, reply) => {
      const { docId } = request.params;
      const jobType = JOBTYPES.PRINTABLE_PDF;

      syncJobHandler(docId, jobType, request, reply);
    },
    config: {
      pre: [ licensePre, userPreRouting ],
      timeout: { socket: socketTimeout },
      tags: [API_TAG],
    },
  });
};
