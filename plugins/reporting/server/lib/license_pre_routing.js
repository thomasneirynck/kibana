const Boom = require('boom');
const oncePerServer = require('./once_per_server');

function LicensePreRoutingFactory(server) {
  const xpackMainPlugin = server.plugins.xpack_main;
  const pluginId = 'reporting';

  // License checking and enable/disable logic
  function forbidApiAccess(request, reply) {
    const licenseCheckResults = xpackMainPlugin.info.feature(pluginId).getLicenseCheckResults();
    if (!licenseCheckResults.showLinks || !licenseCheckResults.enableLinks) {
      reply(Boom.forbidden(licenseCheckResults.message));
    } else {
      reply();
    }
  };

  return forbidApiAccess;
}

module.exports = oncePerServer(LicensePreRoutingFactory);

