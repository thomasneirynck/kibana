import { once, partial } from 'lodash';
import { join, resolve } from 'path';
import mirrorPluginStatus from '../../server/lib/mirror_plugin_status';
import requireAllAndApply from '../../server/lib/require_all_and_apply';
import injectXPackInfoSignature from './server/lib/inject_xpack_info_signature';
import xpackInfo from '../../server/lib/xpack_info';

const registerPreResponseHandlerSingleton = once((server, info) => {
  server.ext('onPreResponse', partial(injectXPackInfoSignature, info));
});

/**
 * Setup the X-Pack Main plugin. This is fired every time that the Elasticsearch plugin becomes Green.
 *
 * This will ensure that X-Pack is installed on the Elasticsearch cluster, as well as trigger the initial
 * polling for _xpack/info.
 *
 * @param server {Object} The Kibana server object.
 * @param xpackMainPlugin {Object} The X-Pack Main plugin object.
 * @param getXPackInfo {Function} The X-Pack Info function construct.
 * @return {Promise} Never {@code null}.
 */
export function setupXPackMain(server, xpackMainPlugin, getXPackInfo) {
  const client = server.plugins.elasticsearch.client; // NOTE: authenticated client using server config auth
  return getXPackInfo(server, client)
  .then(info => {
    server.expose('info', info);
    registerPreResponseHandlerSingleton(server, info);
  })
  .then(() => xpackMainPlugin.status.green('Ready'))
  .catch(reason => {
    let errorMessage = reason;

    if ((reason instanceof Error) && reason.status === 400) {
      errorMessage = 'X-Pack plugin is not installed on Elasticsearch cluster';
    }

    server.expose('info', reason.info);

    xpackMainPlugin.status.red(errorMessage);
  });
}

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
      elasticsearchPlugin.status.on('green', () => setupXPackMain(server, this, xpackInfo));

      return requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server);
    }
  });
}
