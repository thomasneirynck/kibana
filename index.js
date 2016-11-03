import main from './plugins/xpack_main';
import graph from './plugins/graph';
import monitoring from './plugins/monitoring';
import reporting from './plugins/reporting';
import security from './plugins/security';
import profiler from './plugins/profiler';

module.exports = function (kibana) {
  return [
    main(kibana),
    graph(kibana),
    monitoring(kibana),
    reporting(kibana),
    security(kibana),
    profiler(kibana)
  ];
};
