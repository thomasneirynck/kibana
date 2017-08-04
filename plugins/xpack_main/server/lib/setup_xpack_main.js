import { once, partial } from 'lodash';
import { injectXPackInfoSignature } from './inject_xpack_info_signature';

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
 * @return {Promise} Never {@code null}.
 */
export function setupXPackMain(server, xpackMainPlugin, xpackInfo) {
  return xpackInfo(server)
  .then(async info => {
    await info.refreshNow();
    server.expose('info', info);

    if (info.isAvailable()) {
      xpackMainPlugin.status.green('Ready');
      registerPreResponseHandlerSingleton(server, info);
    } else {
      xpackMainPlugin.status.red(info.unavailableReason());
    }
  });

}
