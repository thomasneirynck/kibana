import { resolve } from 'path';
const publicRoutes = require('./server/routes/public');
const fileRoutes = require('./server/routes/file');
const jobRoutes = require('./server/routes/jobs');

const phantom = require('./server/lib/phantom');
const generateDocument = require('./server/lib/generate_document');
const createQueue = require('./server/lib/create_queue');
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
      managementSections: ['plugins/reporting/views/management'],
      injectDefaultVars: function (server) {
        const checkResult = checkLicense(server.plugins.xpackMain.info);

        server.log(['reporting', 'license', 'debug'], `License check: ${checkResult.message}`);
        server.expose('enabled', checkResult.enabled);
        return {
          reportingEnabled: checkResult.enabled
        };
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
        queue: Joi.object({
          indexInterval: Joi.string().default('week'),
          pollInterval: Joi.number().integer().default(3000),
          timeout: Joi.number().integer().default(30000),
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
        plugin.status.red(xpackMainPluginStatus.message);
        return;
      };

      // Register a function that is called whenever the xpack info changes,
      // to re-compute the license check results for this plugin
      server.plugins.xpackMain.info.feature(this.id).registerLicenseCheckResultsGenerator(checkLicense);

      function setup() {
        // prepare phantom binary
        return phantom.install()
        .then(function (binaryPath) {
          server.log(['reporting', 'debug'], `Phantom installed at ${binaryPath}`);

          // intialize and register application components
          server.expose('generateDocument', generateDocument(server));
          server.expose('queue', createQueue(server));

          // Reporting routes
          publicRoutes(server);
          fileRoutes(server);
          jobRoutes(server);
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
