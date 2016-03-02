const publicRoutes = require('./server/routes/public');
const fileRoutes = require('./server/routes/file');
const phantom = require('./server/lib/phantom');
const generatePDFStream = require('./server/lib/generate_pdf_stream');

module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'reporting',
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/discover',
        'plugins/reporting/controls/visualize',
        'plugins/reporting/controls/dashboard',
      ]
    },

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        kibanaApp: Joi.string().regex(/^\//).default('/app/kibana'),
        kibanaServer: Joi.object({
          protocol: Joi.string().valid(['http', 'https']),
          hostname: Joi.string(),
          port: Joi.number().integer()
        }).default(),
        auth: Joi.object({
          username: Joi.string(),
          password: Joi.string()
        }).default(),
        phantom: Joi.object({
          zoom: Joi.number().integer().default(1),
          viewport: Joi.object({
            width: Joi.number().integer().default(1320),
            height: Joi.number().integer().default(640)
          }).default(),
          timeout: Joi.number().integer().default(6000),
          loadDelay: Joi.number().integer().default(3000)
        }).default()
      }).default();
    },

    init: function (server, options) {
      // init the plugin helpers
      const plugin = this;
      const config = server.config();

      // prepare phantom binary
      return phantom.install()
      .then(function (binaryPath) {
        server.log(['reporting', 'debug'], `Phantom installed at ${binaryPath}`);

        // expose internal assets
        server.expose('generatePDFStream', generatePDFStream(server));

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
