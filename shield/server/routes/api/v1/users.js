const Boom = require('boom');
const Joi = require('joi');

module.exports = (server) => {
  const callWithRequest = server.plugins.elasticsearch.callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/shield/v1/users',
    handler(request, reply) {

    }
  });

  server.route({
    method: 'GET',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
    }
  });
};