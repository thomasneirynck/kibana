import {flow} from 'lodash';
import Boom from 'boom';
import getClient from '../../../lib/get_client_shield';
import roleSchema from '../../../lib/role_schema';
import { wrapError } from '../../../lib/errors';

export default (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/security/v1/roles',
    handler(request, reply) {
      return callWithRequest(request, 'shield.getRole').then(
        (response) => reply(response.roles),
        flow(wrapError, reply)
      );
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/roles/{rolename}',
    handler(request, reply) {
      const rolename = request.params.rolename;
      return callWithRequest(request, 'shield.getRole', {rolename}).then(
        (response) => {
          if (response.found) return reply(response.roles[0]);
          return reply(Boom.notFound());
        },
        flow(wrapError, reply));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/security/v1/roles/{rolename}',
    handler(request, reply) {
      const rolename = request.params.rolename;
      const body = request.payload;
      return callWithRequest(request, 'shield.putRole', {rolename, body}).then(
        (response) => reply(body),
        flow(wrapError, reply));
    },
    config: {
      validate: {
        payload: roleSchema
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/security/v1/roles/{rolename}',
    handler(request, reply) {
      const rolename = request.params.rolename;
      return callWithRequest(request, 'shield.deleteRole', {rolename}).then(
        (response) => reply().code(204),
        flow(wrapError, reply));
    }
  });
};
