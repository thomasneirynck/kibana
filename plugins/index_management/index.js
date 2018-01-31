import { resolve } from 'path';
import { registerIndicesRoutes } from './server/routes/api/indices';
import { registerMappingRoute } from './server/routes/api/mapping';
import { registerSettingsRoutes } from './server/routes/api/settings';
import { registerStatsRoute } from './server/routes/api/stats';
import { registerLicenseChecker } from './server/lib/register_license_checker';
import { PLUGIN } from './common/constants';

export function indexManagement(kibana)  {
  return new kibana.Plugin({
    id: PLUGIN.ID,
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    uiExports: {
      managementSections: [
        'plugins/index_management',
      ]
    },
    init: function (server) {
      registerLicenseChecker(server);
      registerIndicesRoutes(server);
      registerSettingsRoutes(server);
      registerStatsRoute(server);
      registerMappingRoute(server);
    }
  });
}
