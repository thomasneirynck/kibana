const boom = require('boom');
const { EVENT_WORKER_COMPLETE, EVENT_WORKER_JOB_FAIL } = require('esqueue/lib/constants/events');
const { JOBTYPES } = require('../lib/constants');
const workersFactory = require('../lib/workers');
const jobsQueryFactory = require('../lib/jobs_query');
const licensePreFactory = require ('../lib/license_pre_routing');
const userPreRoutingFactory = require('../lib/user_pre_routing');

const mainEntry = '/api/reporting/jobs';
const API_TAG = 'api';

module.exports = function (server) {
  const jobQueue = server.plugins.reporting.queue;
  const socketTimeout = server.config().get('xpack.reporting.queue.syncSocketTimeout');
  const workers = workersFactory(server);
  const jobsQuery = jobsQueryFactory(server);
  const licensePre = licensePreFactory(server);
  const userPreRouting = userPreRoutingFactory(server);

  function encodeContent(content, jobType) {
    const worker = workers[jobType];
    switch (worker.encoding) {
      case 'base64':
        return new Buffer(content, 'base64');
      default:
        return content;
    }
  }

  function formatJobOutput(source, jobType) {
    return {
      content: (!jobType) ? source.output.content : encodeContent(source.output.content, jobType),
      content_type: source.output.content_type
    };
  }

  function getJobPayload(doc, jobType) {
    const { status } = doc._source;

    return new Promise((resolve, reject) => {
      if (status === 'completed') {
        resolve(formatJobOutput(doc._source, jobType));
      }

      if (status === 'failed') {
        reject(Object.assign({
          errorCode: 204
        }, formatJobOutput(doc._source)));
      }

      // wait for the job to be completed
      function sendPayload(completed) {
        // if the completed job matches this job
        if (completed.job.id === doc._id) {
          // remove event listener
          cleanupListeners();
          resolve(formatJobOutput(completed, jobType));
        }
      };

      function errorHandler(err) {
        // remove event listener
        cleanupListeners();
        reject(Object.assign({
          errorCode: 504,
        }, err.output));
      };

      function cleanupListeners() {
        jobQueue.removeListener(EVENT_WORKER_COMPLETE, sendPayload);
        jobQueue.removeListener(EVENT_WORKER_JOB_FAIL, errorHandler);
      }

      jobQueue.on(EVENT_WORKER_COMPLETE, sendPayload);
      jobQueue.on(EVENT_WORKER_JOB_FAIL, errorHandler);
    });
  }

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

      return reply('ok to download');

      jobsQuery.get(request, docId, true)
      .then((doc) => {
        if (!doc) return reply(boom.notFound());

        return getJobPayload(doc, jobType)
        .then((output) => {
          const response = reply(output.content);
          response.type(output.content_type);
        })
        .catch((err) => {
          if (err.errorCode === 204) return reply().code(err.errorCode);
          if (err.errorCode === 504) return reply(boom.gatewayTimeout('Report generation failed'));
          reply(boom.badImplementation());
        });
      });
    },
    config: {
      pre: [ licensePre, userPreRouting ],
      timeout: { socket: socketTimeout },
      tags: [API_TAG],
    },
  });
};
