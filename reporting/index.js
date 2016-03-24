const publicRoutes = require('./server/routes/public');
const fileRoutes = require('./server/routes/file');
const phantom = require('./server/lib/phantom');
const generatePDFStream = require('./server/lib/generate_pdf_stream');
const config = require('./server/config/config');

module.exports = function (kibana) {
  return new kibana.Plugin({
    id: 'reporting',
    configPrefix: 'xpack.reporting',
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/discover',
        'plugins/reporting/controls/visualize',
        'plugins/reporting/controls/dashboard',
      ]
    },

    config: config,

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
