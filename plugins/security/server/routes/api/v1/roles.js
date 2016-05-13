import {flow} from 'lodash';
import getClient from '../../../lib/get_client_shield';
import roleSchema from '../../../lib/role_schema';
import { wrapError } from '../../../lib/errors';

export default (server, commonRouteConfig) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/security/v1/roles',
    handler(request, reply) {
      return callWithRequest(request, 'shield.getRole').then(reply, flow(wrapError, reply));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/roles/{rolename}',
    handler(request, reply) {
      const rolename = request.params.rolename;
      return callWithRequest(request, 'shield.getRole', {rolename}).then(reply, flow(wrapError, reply));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/security/v1/roles/{rolename}',
    handler(request, reply) {
      const rolename = request.params.rolename;
      const body = request.payload;
      return callWithRequest(request, 'shield.putRole', {rolename, body}).then(reply, flow(wrapError, reply));
    },
    config: {
      validate: {
        payload: roleSchema
      },
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/security/v1/roles/{rolename}',
    handler(request, reply) {
      const rolename = request.params.rolename;
      return callWithRequest(request, 'shield.deleteRole', {rolename}).then(reply, flow(wrapError, reply));
    },
    config: {
      ...commonRouteConfig
    }
  });
};
