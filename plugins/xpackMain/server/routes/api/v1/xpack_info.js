/*
 * A route to provide the basic XPack info for the production cluster
 */
export default function xpackInfoRoute(server) {
  server.route({
    method: 'GET',
    path: '/api/xpack/v1/info',
    handler: (req, reply) => {
      let response;
      if (server.plugins.xpackMain.info && server.plugins.xpackMain.info.isAvailable()) {
        response = server.plugins.xpackMain.info.toJSON();
      } else {
        response = {};
      }
      return reply(response);
    },
    config: {
      auth: false
    }
  });
}
