const getUser = require('../lib/get_user');
const jobsQueryFactory = require('../lib/jobs_query');

module.exports = function (server) {
  const jobsQuery = jobsQueryFactory(server);
  const mainEntry = '/api/reporting/jobs';

  // defined the public routes
  server.route({
    path: `${mainEntry}/list`,
    method: 'GET',
    handler: (request, reply) => {
      const page = parseInt(request.query.page) || 0;
      const size = Math.min(100, parseInt(request.query.size) || 20);

      const results = getUser(server, request)
      .then((user) => jobsQuery.list(user, page, size));

      reply(results);
    }
  });
};
