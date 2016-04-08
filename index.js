import graph from './plugins/graph';
import monitoring from './plugins/monitoring';
import reporting from './plugins/reporting';
import security from './plugins/security';

module.exports = function (kibana) {
  var plugins = [];

  plugins = plugins.concat(graph(kibana));
  plugins = plugins.concat(monitoring(kibana));
  plugins = plugins.concat(reporting(kibana));
  plugins = plugins.concat(security(kibana));

  return plugins;
};
