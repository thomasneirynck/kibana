import Boom from 'boom';
import { convertKeysToSnakeCaseDeep } from '../../../../../../server/lib/key_case_convertor';

/*
 * A route to provide the basic XPack info for the production cluster
 */
export default function xpackInfoRoute(server) {
  server.route({
    method: 'GET',
    path: '/api/xpack/v1/info',
    handler: (req, reply) => {
      let status;
      let response;
      if (server.plugins.xpack_main.info && server.plugins.xpack_main.info.isAvailable()) {
        response = server.plugins.xpack_main.info.toJSON();
      } else {
        status = Boom.notFound();
        response = {};
      }
      return reply(status, convertKeysToSnakeCaseDeep(response));
    },
    config: {
      auth: false
    }
  });
}
