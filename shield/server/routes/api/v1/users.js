const {flow} = require('lodash');
const root = require('requirefrom')('');
const getClient = root('server/lib/get_client_shield');
const userSchema = root('server/lib/user_schema');
const wrapError = root('server/lib/wrap_error');

module.exports = (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/shield/v1/users',
    handler(request, reply) {
      return callWithRequest(request, 'shield.getUser').then(reply, flow(wrapError, reply));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.getUser', {username}).then(reply, flow(wrapError, reply));
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      const body = request.payload;
      return callWithRequest(request, 'shield.putUser', {username, body}).then(reply, flow(wrapError, reply));
    },
    config: {
      validate: {
        payload: userSchema
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/shield/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.deleteUser', {username}).then(reply, flow(wrapError, reply));
    }
  });
};