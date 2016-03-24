export default (server, uiExports) => {
  const config = server.config();
  const cookieName = config.get('xpack.shield.cookieName');
  const login = uiExports.apps.byId.login;

  server.route({
    method: 'GET',
    path: '/login',
    handler(request, reply) {
      if (request.state[cookieName]) return reply.redirect('./');
      return reply.renderApp(login);
    },
    config: {
      auth: false
    }
  });
};
