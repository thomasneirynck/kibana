import { join, resolve } from 'path';
import Promise from 'bluebird';
import xpackInfo from '../../server/lib/xpack_info';
import xpackUsage from '../../server/lib/xpack_usage';
import requireAllAndApply from '../../server/lib/require_all_and_apply';

export default function (kibana) {
  return new kibana.Plugin({
    id: 'xpackMain',
    publicDir: resolve(__dirname, 'public'),
    require: ['elasticsearch'],
    uiExports: {
      hacks: ['plugins/xpackMain/hacks/check_xpack_info_change'],
    },
    init: function (server) {
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
        function injectXPackInfoSignature(request, reply) {
          // If we're returning an error response, refresh xpack info
          // from Elastisearch in case the error is due to a change in
          // license information in Elasticsearch
          if (request.response instanceof Error) {
            return info.refreshNow()
            .then((refreshedInfo) => {
              const signature = refreshedInfo.getSignature();
              if (signature) {
                request.response.output.headers['kbn-xpack-sig'] = signature;
              }
              return reply.continue();
            });
          } else {
            const signature = info.getSignature();
            if (signature) {
              request.response.headers['kbn-xpack-sig'] = signature;
            }
            return reply.continue();
          }
        };
        server.ext('onPreResponse', injectXPackInfoSignature);
      })
      .then(() => {
        return requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server);
      })
      .catch(reason => {
        let errorMessage = reason;
        if ((reason instanceof Error) && (reason.status === 400)) {
          errorMessage = 'x-pack plugin is not installed on Elasticsearch cluster';
        }
        this.status.red(errorMessage);
      });
    }
  });
}
