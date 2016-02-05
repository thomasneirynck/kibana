import Boom from 'boom';
import getClient from '../../../lib/get_client_shield';

export default (server) => {
  const callWithRequest = getClient(server).callWithRequest;

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
