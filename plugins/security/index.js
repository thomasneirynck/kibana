import hapiAuthCookie from 'hapi-auth-cookie';
import { resolve } from 'path';
import Boom from 'boom';
import basicAuth from './server/lib/basic_auth';
import getIsValidUser from './server/lib/get_is_valid_user';
import getValidate from './server/lib/get_validate';
import getCalculateExpires from './server/lib/get_calculate_expires';
import createExpose from './server/lib/create_expose';
import initAuthenticateApi from './server/routes/api/v1/authenticate';
import initUsersApi from './server/routes/api/v1/users';
import initRolesApi from './server/routes/api/v1/roles';
import initIndicesApi from './server/routes/api/v1/indices';
import initLoginView from './server/routes/views/login';
import initLogoutView from './server/routes/views/logout';
import validateConfig from './server/lib/validate_config';
import setElasticsearchAuth from './server/lib/set_elasticsearch_auth';
import createScheme from './server/lib/login_scheme';
import checkLicense from './server/lib/check_license';
import mirrorPluginStatus from '../../server/lib/mirror_plugin_status';

export default (kibana) => new kibana.Plugin({
  id: 'security',
  configPrefix: 'xpack.security',
  publicDir: resolve(__dirname, 'public'),
  require: ['kibana', 'elasticsearch', 'xpackMain'],

  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true),
      cookieName: Joi.string().default('sid'),
      clientCookieName: Joi.string().default('user'),
      encryptionKey: Joi.string(),
      sessionTimeout: Joi.number().default(30 * 60 * 1000),
      secureCookies: Joi.boolean().default(false)
    }).default();
  },

  uiExports: {
    chromeNavControls: ['plugins/security/views/nav_control'],
    settingsSections: ['plugins/security/views/settings'],
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/security/views/login',
      hidden: true
    }, {
      id: 'logout',
      title: 'Logout',
      main: 'plugins/security/views/logout',
      hidden: true
    }],
    hacks: ['plugins/security/hacks/on_session_timeout'],
    injectDefaultVars: function (server) {

      const config = server.config();
      return {
        secureCookies: config.get('xpack.security.secureCookies'),
        sessionTimeout: config.get('xpack.security.sessionTimeout'),
        clientCookieName: config.get('xpack.security.clientCookieName')
      };
    }
  },

  preInit(server) {
    setElasticsearchAuth(server.config());
  },

  init(server) {
    const thisPlugin = this;
    const xpackMainPlugin = server.plugins.xpackMain;
    mirrorPluginStatus(xpackMainPlugin, thisPlugin);
    xpackMainPlugin.status.once('green', setup);

    function setup() {
      // Register a function that is called whenever the xpack info changes,
      // to re-compute the license check results for this plugin
      server.plugins.xpackMain.info.feature(thisPlugin.id).registerLicenseCheckResultsGenerator(checkLicense);

      const config = server.config();
      validateConfig(config, message => server.log(['security', 'warning'], message));

      const commonCookieConfig = {
        isSecure: config.get('xpack.security.secureCookies'),
        path: config.get('server.basePath') + '/'
      };

      // Registers the client-readable cookie which stores user information for display purposes
      // (as opposed to the session cookie which is HTTP only and stores username/password)
      const clientCookieName = config.get('xpack.security.clientCookieName');
      server.state(clientCookieName, commonCookieConfig);

      if (server.plugins.security.showSecurityFeatures) {
        const cookieName = config.get('xpack.security.cookieName');
        server.register(hapiAuthCookie, (error) => {
          if (error != null) throw error;

          server.auth.scheme('login', createScheme({
            redirectUrl: (path) => loginUrl(config.get('server.basePath'), path),
            strategy: 'security'
          }));

          server.auth.strategy('session', 'login', 'required');

          server.auth.strategy('security', 'cookie', false, {
            cookie: cookieName,
            password: config.get('xpack.security.encryptionKey'),
            clearInvalid: true,
            validateFunc: getValidate(server),
            ...commonCookieConfig
          });
        });

        basicAuth.register(server, cookieName, getIsValidUser(server), getCalculateExpires(server));
      }

      createExpose(server);

      const commonRouteConfig = {
        pre: [
          function forbidApiAccess(request, reply) {
            if (!server.plugins.security.allowLogin || !server.plugins.security.showSecurityFeatures) {
              reply(Boom.forbidden('License has expired '
                + 'OR security is not available with this license '
                + 'OR security has been disabled in Elasticsearch'));
            } else {
              reply();
            }
          }
        ]
      };

      initAuthenticateApi(server, {commonRouteConfig, clientCookieName});
      initUsersApi(server, {commonRouteConfig});
      initRolesApi(server, {commonRouteConfig});
      initIndicesApi(server);
      initLoginView(server, thisPlugin);
      initLogoutView(server, thisPlugin);
    }
  }
});

function loginUrl(baseUrl, requestedPath) {
  const next = encodeURIComponent(requestedPath);
  return `${baseUrl}/login?next=${next}`;
}
