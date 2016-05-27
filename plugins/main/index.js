import { join } from 'path';
import xpackInfo from '../../server/lib/xpack_info';
import requireAllAndApply from '../../server/lib/require_all_and_apply';

export default function (kibana) {
  return new kibana.Plugin({
    id: 'xpackMain',
    require: ['elasticsearch'],
    init: function (server) {
      const client = server.plugins.elasticsearch.client; // NOTE: authenticated client using server config auth
      return xpackInfo(server, client)
      .then(info => {
        server.expose('info', info);
        return requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server);
      })
      .catch(reason => {
        if ((reason instanceof Error) && (reason.status === 400)) {
          const errorMessage = 'x-pack plugin is not installed on Elasticsearch cluster';
          this.status.red(errorMessage);
        }
      });
    }
  });
}
