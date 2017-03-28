import getClient from '../get_client_ml';
import { wrapError } from '../errors';

export default (server, commonRouteConfig) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'POST',
    path: '/api/ml/_has_privileges',
    handler(request, reply) {
      const xpackMainPlugin = server.plugins.xpack_main;
      const xpackInfo = xpackMainPlugin && xpackMainPlugin.info;
      const securityInfo = xpackInfo && xpackInfo.isAvailable() && xpackInfo.feature('security');

      if (securityInfo && securityInfo.isEnabled() === false) {
        // if xpack.security.enabled has been explicitly set to false
        // return that security is disabled and don't call the privilegeCheck endpoint
        reply({securityDisabled: true});
      } else {
        const body = request.payload;
        return callWithRequest(request, 'ml.privilegeCheck', {body})
        .then(resp => reply(resp))
        .catch(resp => reply(wrapError(resp)));
      }
    },
    config: {
      ...commonRouteConfig
    }
  });

};
