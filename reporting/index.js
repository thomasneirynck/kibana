var publicRoutes = require('./server/routes/public');
var fileRoutes = require('./server/routes/file');
var createClient = require('./server/lib/create_client');
var phantom = require('./server/lib/phantom');

module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'reporting',
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/dashboard',
      ]
    },

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        kibanaApp: Joi.string().regex(/^\//).default('/app/kibana'),
        auth: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }).default(),
        phantom: Joi.object({
          zoom: Joi.number().integer().default(1),
          viewport: Joi.object({
            width: Joi.number().integer().default(1320),
            height: Joi.number().integer().default(640)
          }).default(),
          loadDelay: Joi.number().integer().default(3000)
        }).default(),
        workingDir: Joi.string().default('.tmp')
      }).default();
    },

    init: function (server, options) {
      // init the plugin helpers
      const plugin = this;
      const config = server.config();

      // create ES client instance for reporting, expose on server
      const client = createClient(server.plugins.elasticsearch, {
        username: config.get('reporting.auth.username'),
        password: config.get('reporting.auth.password'),
      });
      server.expose('client', client);

      // make sure we can communicate with ES
      client.checkConnection()
      .then(function () {
        // prepare phantom binary
        return phantom.install()
      })
      .then(function () {
        // Reporting routes
        publicRoutes(server);
        fileRoutes(server);
      })
      .catch(function (err) {
        return plugin.status.red(err.message);
      });
    }
  });
};
