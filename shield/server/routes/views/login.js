module.exports = (server, uiExports) => {
  const login = uiExports.apps.byId.login;
  server.route({
    method: 'GET',
    path: '/login',
    handler(request, reply) {
      return reply.renderApp(login);
    },
    config: {
      auth: false
    }
  });
};