import {flow} from 'lodash';
import getClient from '../../../lib/get_client_shield';
import userSchema from '../../../lib/user_schema';
import { wrapError } from '../../../lib/errors';

export default (server) => {
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
