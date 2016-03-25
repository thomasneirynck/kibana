/*
 * This endpoint is ONLY for development and internal testing.
 */
const root = require('requirefrom')('');
const handleError = root('server/lib/handle_error');
module.exports = (server) => {
  const callWithRequest = server.plugins.monitoring.callWithRequest;
  server.route({
    path: '/api/monitoring/v1/phone-home',
    method: 'POST',
    handler: (req, reply) => {
      // Change to true to test indexing the data. Note, user must have privileges
      if (false) {
        const body = req.payload;
        const options = {
          index: '.monitoring',
          meta: 'route-phone_home',
          type: 'phone_home',
          body: body
        };
        callWithRequest(req, 'index', options)
        .then(reply)
        .catch(err => reply(handleError(err, req)));
      } else {
        reply({});
      }
    }
  });
};
