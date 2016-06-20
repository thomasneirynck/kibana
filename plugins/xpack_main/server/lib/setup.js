import { partial, once } from 'lodash';
import Promise from 'bluebird';
import xpackInfo from '../../../../server/lib/xpack_info';
import xpackUsage from '../../../../server/lib/xpack_usage';
import injectXPackInfoSignature from './inject_xpack_info_signature';

let xpackInfoSingleton = once(xpackInfo);
let registerPreResponseHandlerSingleton = once((server, info) => {
  server.ext('onPreResponse', partial(injectXPackInfoSignature, info));
});

export default function setup(server, xpackMainPlugin) {
  const client = server.plugins.elasticsearch.client; // NOTE: authenticated client using server config auth
  return Promise.all([
    xpackInfoSingleton(server, client),
    xpackUsage(client)
  ])
  .then(([ info, usage ]) => {
    server.expose('info', info);
    server.expose('usage', usage);
    return info;
  })
  .then(info => {
    registerPreResponseHandlerSingleton(server, info);
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
