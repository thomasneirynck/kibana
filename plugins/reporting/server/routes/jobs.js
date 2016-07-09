const getUserFactory = require('../lib/get_user');
const jobsQueryFactory = require('../lib/jobs_query');
const boom = require('boom');

module.exports = function (server, commonRouteConfig) {
  const jobsQuery = jobsQueryFactory(server);
  const getUser = getUserFactory(server);

  const mainEntry = '/api/reporting/jobs';

  // list jobs in the queue, paginated
  server.route({
    path: `${mainEntry}/list`,
    method: 'GET',
    handler: (request, reply) => {
      const page = parseInt(request.query.page) || 0;
      const size = Math.min(100, parseInt(request.query.size) || 10);

      const results = getUser(request)
      .then((user) => jobsQuery.list(user, page, size));

      reply(results);
    },
    config: {
      ...commonRouteConfig
    }
  });

  // list all completed jobs since a specified time
  server.route({
    path: `${mainEntry}/list_completed_since`,
    method: 'GET',
    handler: (request, reply) => {
      const size = Math.min(100, parseInt(request.query.size) || 10);
      const sinceInMs = Date.parse(request.query.since) || null;

      const results = getUser(request)
      .then(user => jobsQuery.listCompletedSince(user, size, sinceInMs));

      reply(results);
    },
    config: {
      ...commonRouteConfig
    }
  });

  // return the count of all jobs in the queue
  server.route({
    path: `${mainEntry}/count`,
    method: 'GET',
    handler: (request, reply) => {
      const results = getUser(request)
      .then((user) => jobsQuery.count(user));

      reply(results);
    },
    config: {
      ...commonRouteConfig
    }
  });

  // return the raw output from a job
  server.route({
    path: `${mainEntry}/output/{docId}`,
    method: 'GET',
    handler: (request, reply) => {
      const { docId } = request.params;

      getUser(request)
      .then((user) => jobsQuery.get(user, docId, true))
      .then((doc) => {
        if (!doc) return reply(boom.notFound());
        reply(doc._source.output);
      });
    },
    config: {
      ...commonRouteConfig
    }
  });

  // trigger a download of the output from a job
  server.route({
    path: `${mainEntry}/download/{docId}`,
    method: 'GET',
    handler: (request, reply) => {
      const { docId } = request.params;

      getUser(request)
      .then((user) => jobsQuery.get(user, docId, true))
      .then((doc) => {
        if (!doc || doc._source.status !== 'completed') return reply(boom.notFound());

        const content = new Buffer(doc._source.output.content, 'base64');
        const response = reply(content);
        if (doc._source.output.content_type) response.type(doc._source.output.content_type);
      });
    },
    config: {
      ...commonRouteConfig
    }
  });
};
