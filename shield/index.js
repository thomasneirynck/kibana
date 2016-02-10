const hapiAuthCookie = require('hapi-auth-cookie');
const join = require('path').join;
const root = require('requirefrom')('');
const basicAuth = root('server/lib/basic_auth');
const validateConfig = root('server/lib/validate_config');

module.exports = (kibana) => new kibana.Plugin({
  id: 'shield',
  require: ['elasticsearch'],
  publicDir: join(__dirname, 'public'),

  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true),
      cookieName: Joi.string().default('sid'),
      encryptionKey: Joi.string(),
      sessionTimeout: Joi.number().default(30 * 60 * 1000),
      // Only use this if SSL is still configured, but it's configured outside of the Kibana server
      // (e.g. SSL is configured on a load balancer)
      skipSslCheck: Joi.boolean().default(false)
    }).default();
  },

  uiExports: {
    chromeNavControls: ['plugins/shield/views/logout_button'],
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/shield/views/login',
      hidden: true
    }, {
      id: 'logout',
      title: 'Logout',
      main: 'plugins/shield/views/logout',
      hidden: true
    }]
  },

  init(server, options) {
    const config = server.config();
    validateConfig(config);

    server.register(hapiAuthCookie, (error) => {
      if (error != null) throw error;

      server.auth.strategy('session', 'cookie', 'required', {
        cookie: config.get('shield.cookieName'),
        password: config.get('shield.encryptionKey'),
        ttl: config.get('shield.sessionTimeout'),
        path: config.get('server.basePath') + '/',
        clearInvalid: true,
        keepAlive: true,
        redirectTo: `${config.get('server.basePath')}/login`,
        validateFunc: root('server/lib/validate')(server)
      });
    });

    basicAuth.register(server, config.get('shield.cookieName'));

    root('server/routes/api/v1/authenticate')(server);
    root('server/routes/api/v1/users')(server);
    root('server/routes/api/v1/roles')(server);
    root('server/routes/views/login')(server, this);
    root('server/routes/views/logout')(server, this);
  }
});
