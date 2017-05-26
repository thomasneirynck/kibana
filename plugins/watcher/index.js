import { resolve } from 'path';
import { registerFieldsRoutes } from './server/routes/api/fields';
import { registerHistoryRoutes } from './server/routes/api/history';
import { registerWatchesRoutes } from './server/routes/api/watches';
import { registerWatchRoutes } from './server/routes/api/watch';
import { registerLicenseChecker } from './server/lib/register_license_checker';
import { PLUGIN } from './common/constants';

export const watcher = (kibana) => new kibana.Plugin({
  id: PLUGIN.ID,
  publicDir: resolve(__dirname, 'public'),
  require: ['kibana', 'elasticsearch', 'xpack_main'],
  uiExports: {
    managementSections: [
      'plugins/watcher/sections/testbed',
      'plugins/watcher/sections/watch_detail',
      'plugins/watcher/sections/watch_edit',
      'plugins/watcher/sections/watch_list',
      'plugins/watcher/sections/watch_history_item',
    ],
    hacks: [
      'plugins/watcher/hacks/getting_started'
    ]
  },
  init: function (server) {
    registerLicenseChecker(server);

    registerFieldsRoutes(server);
    registerHistoryRoutes(server);
    registerWatchesRoutes(server);
    registerWatchRoutes(server);
  }
});
