import getClient from '../get_client_ml';
import { wrapError } from '../errors';

export default (server, commonRouteConfig) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'POST',
    path: '/api/ml/_has_privileges',
    handler(request, reply) {
      const body = request.payload;
      return callWithRequest(request, 'ml.privilegeCheck', {body})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

};
