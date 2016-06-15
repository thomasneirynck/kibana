import { join } from 'path';
import { partial } from 'lodash';
import Promise from 'bluebird';
import xpackInfo from '../../../../server/lib/xpack_info';
import xpackUsage from '../../../../server/lib/xpack_usage';
import requireAllAndApply from '../../../../server/lib/require_all_and_apply';
import injectXPackInfoSignature from './inject_xpack_info_signature';

let preResponseHandlerRegistered = false;
let routesRegistered = false;

export default function setup(server, xpackMainPlugin) {
  const client = server.plugins.elasticsearch.client; // NOTE: authenticated client using server config auth
  return Promise.all([
    xpackInfo(server, client),
    xpackUsage(client)
  ])
  .then(([ info, usage ]) => {
    server.expose('info', info);
    server.expose('usage', usage);
    return info;
  })
  .then(info => {
    // Register the onPreResponse handler, but only once
    if (!preResponseHandlerRegistered) {
      server.ext('onPreResponse', partial(injectXPackInfoSignature, info));
      preResponseHandlerRegistered = true;
    }
  })
  .then(() => {
    // Register routes, but only once
    if (!routesRegistered) {
      return requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server)
      .then(() => routesRegistered = true);
    }
  })
  .then(() => xpackMainPlugin.status.green('Ready'))
  .catch(reason => {
    let errorMessage = reason;
    if ((reason instanceof Error) && (reason.status === 400)) {
      errorMessage = 'x-pack plugin is not installed on Elasticsearch cluster';
    }
    xpackMainPlugin.status.red(errorMessage);
  });
}
