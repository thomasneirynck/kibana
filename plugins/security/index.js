import { resolve } from 'path';
import { getUserProvider } from './server/lib/get_user';
import { initAuthenticateApi } from './server/routes/api/v1/authenticate';
import { initUsersApi } from './server/routes/api/v1/users';
import { initRolesApi } from './server/routes/api/v1/roles';
import { initIndicesApi } from './server/routes/api/v1/indices';
import { initLoginView } from './server/routes/views/login';
import { initLogoutView } from './server/routes/views/logout';
import { validateConfig } from './server/lib/validate_config';
import { createScheme } from './server/lib/login_scheme';
import { checkLicense } from './server/lib/check_license';
import { initAuthenticator } from './server/lib/authentication/authenticator';
import { mirrorPluginStatus } from '../../server/lib/mirror_plugin_status';
import { LOGIN_DISABLED_MESSAGE } from './server/lib/login_disabled_message';

export const security = (kibana) => new kibana.Plugin({
  id: 'security',
  configPrefix: 'xpack.security',
  publicDir: resolve(__dirname, 'public'),
  require: ['kibana', 'elasticsearch', 'xpack_main'],

  config(Joi) {
    return Joi.object({
      authProviders: Joi.array().items(Joi.string()).default(['basic']),
      enabled: Joi.boolean().default(true),
      cookieName: Joi.string().default('sid'),
      encryptionKey: Joi.string(),
      sessionTimeout: Joi.number().allow(null).default(null),
      secureCookies: Joi.boolean().default(false)
    }).default();
  },

  uiExports: {
    chromeNavControls: ['plugins/security/views/nav_control'],
    managementSections: ['plugins/security/views/management'],
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/security/views/login',
      hidden: true,
      injectVars(server) {
        const pluginId = 'security';
        const xpackInfo = server.plugins.xpack_main.info;

        if (!xpackInfo) {
          const loginMessage = LOGIN_DISABLED_MESSAGE;

          return {
            loginState: {
              showLogin: true,
              allowLogin: false,
              loginMessage,
            }
          };
        }

        const { showLogin, loginMessage, allowLogin } = xpackInfo.feature(pluginId).getLicenseCheckResults() || {};

        return {
          loginState: {
            showLogin,
            allowLogin,
            loginMessage
          }
        };
      }
    }, {
      id: 'logout',
      title: 'Logout',
      main: 'plugins/security/views/logout',
      hidden: true
    }],
    hacks: [
      'plugins/security/hacks/on_session_timeout',
      'plugins/security/hacks/on_unauthorized_response'
    ],
    home: ['plugins/security/register_feature'],
    injectDefaultVars: function (server) {
      const config = server.config();

      return {
        secureCookies: config.get('xpack.security.secureCookies'),
        sessionTimeout: config.get('xpack.security.sessionTimeout')
      };
    }
  },

  async init(server) {
    const thisPlugin = this;
    const xpackMainPlugin = server.plugins.xpack_main;
    mirrorPluginStatus(xpackMainPlugin, thisPlugin);
    xpackMainPlugin.status.once('green', () => {
      // Register a function that is called whenever the xpack info changes,
      // to re-compute the license check results for this plugin
      xpackMainPlugin.info.feature(thisPlugin.id).registerLicenseCheckResultsGenerator(checkLicense);
    });

    const config = server.config();
    validateConfig(config, message => server.log(['security', 'warning'], message));

    server.auth.scheme('login', createScheme({
      redirectUrl: (path) => loginUrl(config.get('server.basePath'), path)
    }));

    // The `required` means that the `session` strategy that is based on `login` schema defined above will be
    // automatically assigned to all routes that don't contain an auth config.
    server.auth.strategy('session', 'login', 'required');

    getUserProvider(server);

    await initAuthenticator(server);
    initAuthenticateApi(server);
    initUsersApi(server);
    initRolesApi(server);
    initIndicesApi(server);
    initLoginView(server, thisPlugin, xpackMainPlugin);
    initLogoutView(server, thisPlugin);

  }
});

function loginUrl(basePath, requestedPath) {
  // next must include basePath otherwise it'll be ignored
  const next = encodeURIComponent(`${basePath}${requestedPath}`);
  return `${basePath}/login?next=${next}`;
}
