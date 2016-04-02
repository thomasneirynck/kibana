import _ from 'lodash';
import Boom from 'boom';
import getClient from '../../../lib/get_client_shield';
import userSchema from '../../../lib/user_schema';
import { wrapError } from '../../../lib/errors';

export default (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/security/v1/users',
    handler(request, reply) {
      return callWithRequest(request, 'shield.getUser').then(
        (response) => reply(_.values(response)),
        _.flow(wrapError, reply)
      );
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.getUser', {username}).then(
        (response) => {
          if (response[username]) return reply(response[username]);
          return reply(Boom.notFound());
        },
        _.flow(wrapError, reply));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/security/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      const body = _(request.payload).omit('username').omit(_.isNull);
      return callWithRequest(request, 'shield.putUser', {username, body}).then(
        (response) => reply(request.payload),
        _.flow(wrapError, reply));
    },
    config: {
      validate: {
        payload: userSchema
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/security/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.deleteUser', {username}).then(
        (response) => reply().code(204),
        _.flow(wrapError, reply));
    }
  });
};
