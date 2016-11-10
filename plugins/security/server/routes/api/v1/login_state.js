export default (server) => {
  const pluginId = 'security';

  server.route({
    method: 'GET',
    path: '/api/security/v1/login_state',
    handler(request, reply) {
      const xpackInfo = server.plugins.xpack_main.info;
      const { showLogin, loginMessage, allowLogin } = xpackInfo.feature(pluginId).getLicenseCheckResults();

      return reply({
        showLogin,
        allowLogin,
        loginMessage
      });
    },
    config: {
      auth: false
    }
  });

};
