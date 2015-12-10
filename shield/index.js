const hapiAuthCookie = require('hapi-auth-cookie');
const root = require('requirefrom')('');

module.exports = (kibana) => new kibana.Plugin({
  name: 'shield',
  require: ['elasticsearch'],

  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true),
      encryptionKey: Joi.string().required(),
      sessionTimeout: Joi.number().default(30 * 60 * 1000)
    }).default()
  },

  uiExports: {
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/shield/views/login',
      hidden: true,
      autoload: kibana.autoload.styles
    }]
  },

  init(server, options) {
    const config = server.config();

    server.register(hapiAuthCookie, (error) => {
      if (error != null) throw error;

      server.auth.strategy('session', 'cookie', 'required', {
        cookie: 'sid',
        password: config.get('shield.encryptionKey'),
        ttl: config.get('shield.sessionTimeout'),
        clearInvalid: true,
        keepAlive: true,
        isSecure: false, // TODO: Remove this
        redirectTo: '/login',
        validateFunc: root('server/lib/validate')(server)
      });
    });

    root('server/routes/api/v1/login')(server);
    root('server/routes/views/login')(server, this);
    root('server/routes/views/logout')(server);
  }
});