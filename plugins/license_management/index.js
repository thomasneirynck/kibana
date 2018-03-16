import { resolve } from 'path';
import { PLUGIN } from './common/constants';
import { registerLicenseRoute, registerStartTrialRoutes, registerStartBasicRoute } from "./server/routes/api/license/";

export function licenseManagement(kibana)  {
  return new kibana.Plugin({
    id: PLUGIN.ID,
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      managementSections: [
        'plugins/license_management',
      ]
    },
    init: (server) => {
      registerLicenseRoute(server);
      registerStartTrialRoutes(server);
      registerStartBasicRoute(server);
    }
  });
}
