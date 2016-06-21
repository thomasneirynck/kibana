import { join, resolve } from 'path';
import { partial } from 'lodash';
import mirrorPluginStatus from '../../server/lib/mirror_plugin_status';
import requireAllAndApply from '../../server/lib/require_all_and_apply';
import setup from './server/lib/setup';

export default function (kibana) {
  return new kibana.Plugin({
    id: 'xpack_main',
    publicDir: resolve(__dirname, 'public'),
    require: ['elasticsearch'],
    uiExports: {
      hacks: ['plugins/xpack_main/hacks/check_xpack_info_change'],
    },
    init: function (server) {
      const elasticsearchPlugin = server.plugins.elasticsearch;
      mirrorPluginStatus(elasticsearchPlugin, this, 'yellow', 'red');
      elasticsearchPlugin.status.on('green', partial(setup, server, this));

      return requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server);
    }
  });
}
