const Joi = require('joi');
const root = require('requirefrom')('');
const getClient = root('server/lib/get_client_shield');

module.exports = (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/shield/v1/users',
    handler(request, reply) {
      return callWithRequest(request, 'shield.getUser').then(
        reply,
        (error) => reply(error.toString())
      );
    }
  });

  server.route({
    method: 'GET',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.getUser', {username}).then(
        reply,
        (error) => reply(error.toString())
      );
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      const body = request.payload;
      return callWithRequest(request, 'shield.putUser', {username, body}).then(
        reply,
        (error) => reply(error.toString())
      );
    },
    config: {
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().required(),
          roles: Joi.array().items(Joi.string())
        }
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.deleteUser', {username}).then(
        reply,
        (error) => reply(error.toString())
      );
    }
  });
};