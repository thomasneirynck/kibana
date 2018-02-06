// all routes for the app
export {
  checkAccessRoute
} from './check_access';
export {
  clusterAlertsRoute
} from './alerts/';
export {
  beatsDetailRoute,
  beatsListingRoute,
  beatsOverviewRoute
} from './beats';
export {
  clusterRoute,
  clustersRoute
} from './cluster';
export {
  esIndexRoute,
  esIndicesRoute,
  esNodeRoute,
  esNodesRoute,
  esOverviewRoute,
  mlJobRoute
} from './elasticsearch';
export {
  kibanaInstanceRoute,
  kibanaInstancesRoute,
  kibanaOverviewRoute
} from './kibana';
export {
  logstashClusterPipelinesRoute,
  logstashNodePipelinesRoute,
  logstashNodeRoute,
  logstashNodesRoute,
  logstashOverviewRoute,
  logstashPipelineRoute
} from './logstash';
