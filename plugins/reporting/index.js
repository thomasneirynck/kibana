import { resolve } from 'path';
import { format } from 'util';
const publicRoutes = require('./server/routes/public');
const fileRoutes = require('./server/routes/file');
const phantom = require('./server/lib/phantom');
const generatePDFStream = require('./server/lib/generate_pdf_stream');
const appConfig = require('./server/config/config');
const checkLicense = require('./server/lib/check_license');

module.exports = function (kibana) {
  return new kibana.Plugin({
    id: 'reporting',
    configPrefix: 'xpack.reporting',
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch', 'xpackMain'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/discover',
        'plugins/reporting/controls/visualize',
        'plugins/reporting/controls/dashboard',
      ],
      injectDefaultVars: function (server) {
        const checker = checkLicense(server.plugins.elasticsearch.client);

        function registerVars(enabled) {
          server.expose('enabled', enabled);

          return {
            reportingEnabled: enabled
          };
        }

        return checker.check()
        .then((check) => {
          server.log(['reporting', 'license', 'debug'], `License check: ${check.message}`);
          return registerVars(check.enabled);
        })
        .catch(() => registerVars(false));
      },
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
        phantom: Joi.object({
          zoom: Joi.number().integer().default(1),
          viewport: Joi.object({
            width: Joi.number().integer().default(1320),
            height: Joi.number().integer().default(640)
          }).default(),
          timeout: Joi.number().integer().default(6000),
          loadDelay: Joi.number().integer().default(3000)
        }).default(),
        capture: Joi.object({
          concurrency: Joi.number().integer().default(appConfig.concurrency),
        }).default(),
      }).default();
    },

    init: function (server) {
      // init the plugin helpers
      const plugin = this;
      const xpackMainPluginStatus = server.plugins.xpackMain.status;
      if (xpackMainPluginStatus.state === 'red') {
        plugin.status.red(format(xpackMainPluginStatus.message));
        return;
      };

      function setup() {
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

      if (!server.plugins.reporting.enabled) {
        server.log(['warning', 'reporting'], 'Reporting is disabled. Please check your license.');
        return;
      }

      return setup();
    }
  });
};
