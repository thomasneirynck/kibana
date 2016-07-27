export default (server, uiExports, xpackInfo) => {
  const config = server.config();
  const cookieName = config.get('xpack.security.cookieName');
  const login = uiExports.apps.byId.login;

  server.route({
    method: 'GET',
    path: '/login',
    handler(request, reply) {

      const isUserAlreadyLoggedIn = !!request.state[cookieName];
      const isSecurityDisabledInES = xpackInfo && xpackInfo.isAvailable() && !xpackInfo.feature('security').isEnabled();
      if (isUserAlreadyLoggedIn || isSecurityDisabledInES) return reply.redirect('./');
      return reply.renderApp(login);
    },
    config: {
      auth: false
    }
  });
};
