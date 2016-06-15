import { resolve } from 'path';
import { partial } from 'lodash';
import mirrorPluginStatus from '../../server/lib/mirror_plugin_status';
import setup from './server/lib/setup';

export default function (kibana) {
  return new kibana.Plugin({
    id: 'xpackMain',
    publicDir: resolve(__dirname, 'public'),
    require: ['elasticsearch'],
    uiExports: {
      hacks: ['plugins/xpackMain/hacks/check_xpack_info_change'],
    },
    init: function (server) {
      const elasticsearchPlugin = server.plugins.elasticsearch;
      mirrorPluginStatus(elasticsearchPlugin, this, 'yellow', 'red');
      elasticsearchPlugin.status.on('green', partial(setup, server, this));
    }
  });
}
