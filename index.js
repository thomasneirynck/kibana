import main from './plugins/xpackMain';
import graph from './plugins/graph';
import monitoring from './plugins/monitoring';
import reporting from './plugins/reporting';
import security from './plugins/security';

module.exports = function (kibana) {
  return [
    main(kibana),
    graph(kibana),
    monitoring(kibana),
    reporting(kibana),
    security(kibana)
  ];
};
