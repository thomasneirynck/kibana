import { join } from 'path';
import requireAllAndApply from './server/lib/require_all_and_apply';
import xpackInfo from './server/lib/xpack_info';
import graph from './plugins/graph';
import monitoring from './plugins/monitoring';
import reporting from './plugins/reporting';
import security from './plugins/security';

function main(kibana) {
  return new kibana.Plugin({
    id: 'xpackMain',
    require: ['elasticsearch'],
    init: function (server) {
      const client = server.plugins.elasticsearch.client; // NOTE: is an authenticated client
      xpackInfo(client)
      .then((info) => {
        server.expose('info', info);
        requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server);
      });
    }
  });
}

module.exports = function (kibana) {
  let plugins = [];

  plugins = plugins.concat(main(kibana));
  plugins = plugins.concat(graph(kibana));
  plugins = plugins.concat(monitoring(kibana));
  plugins = plugins.concat(reporting(kibana));
  plugins = plugins.concat(security(kibana));

  return plugins;
};
