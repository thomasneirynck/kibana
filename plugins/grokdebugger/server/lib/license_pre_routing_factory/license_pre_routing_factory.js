import Boom from 'boom';
import { PLUGIN } from '../../../common/constants';

export const licensePreRoutingFactory = (server) => {
  const xpackMainPlugin = server.plugins.xpack_main;

  // License checking and enable/disable logic
  function licensePreRouting(request, reply) {
    const licenseCheckResults = xpackMainPlugin.info.feature(PLUGIN.ID).getLicenseCheckResults();
    if (!licenseCheckResults.enableAPIRoute) {
      reply(Boom.forbidden(licenseCheckResults.message));
    } else {
      reply();
    }
  }

  return licensePreRouting;
};
