import { get } from 'lodash';

export default (server, uiExports, xpackMainPlugin) => {
  const config = server.config();
  const cookieName = config.get('xpack.security.cookieName');
  const login = uiExports.apps.byId.login;

  server.route({
    method: 'GET',
    path: '/login',
    handler(request, reply) {

      const xpackInfo = xpackMainPlugin && xpackMainPlugin.info;
      const isSecurityDisabledInES = xpackInfo && xpackInfo.isAvailable() && !xpackInfo.feature('security').isEnabled();
      const isUserAlreadyLoggedIn = !!request.state[cookieName];
      if (isUserAlreadyLoggedIn || isSecurityDisabledInES) {
        const next = get(request, 'query.next', '/');
        return reply.redirect(`${config.get('server.basePath')}${next}`);
      }
      return reply.renderApp(login);
    },
    config: {
      auth: false
    }
  });
};
