var publicRoutes = require('./server/routes/public');
var apiRoutes = require('./server/routes/api');
var phantom = require('./server/lib/phantom');
var kibanaConfig = require('./server/lib/kibana_config');

module.exports = function (kibana) {
  return new kibana.Plugin({

    name: 'reporting',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      app: {
        title: 'Reporting',
        description: 'An awesome Kibana reporting plugin',
        main: 'plugins/reporting/app',
        injectVars: function (server, options) {
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout')
          };
        }
      }
    },

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        kibanaApp: Joi.string().default('/app/kibana'),
        auth: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }).default(),
        phantom: Joi.object({
          zoom: Joi.number().integer().default(1),
          viewport: Joi.object({
            width: Joi.number().integer().default(1920),
            height: Joi.number().integer().default(1080)
          }).default(),
          loadDelay: Joi.number().integer().default(3000)
        }).default(),
        workingDir: Joi.string().default('.tmp')
      }).default();
    },

    init: function (server, options) {
      // init the plugin helpers
      kibanaConfig.set(server.config());
      var plugin = this;

      // Reporting routes
      apiRoutes(server);
      publicRoutes(server);

      // prepare phantom binary
      return phantom.install()
      .catch(function (err) {
        plugin.status.red(err.message);
      });
    }
  });
};

