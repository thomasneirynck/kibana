const Boom = require('boom');
const Joi = require('joi');

module.exports = (server) => {
  const callWithRequest = server.plugins.elasticsearch.callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/shield/v1/roles',
    handler(request, reply) {

    }
  });

  server.route({
    method: 'GET',
    path: '/api/shield/v1/roles/{roleId}',
    handler(request, reply) {
      const roleId = request.params.roleId;
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/shield/v1/roles/{roleId}',
    handler(request, reply) {
      const roleId = request.params.roleId;
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/shield/v1/roles/{roleId}',
    handler(request, reply) {
      const roleId = request.params.roleId;
    }
  });
};