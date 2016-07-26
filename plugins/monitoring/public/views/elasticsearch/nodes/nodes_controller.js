/**
 * Controller for Node Listing
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handlers';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/elasticsearch/nodes/nodes_template.html';

function getPageData(timefilter, globalState, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/nodes`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    listingMetrics: [
      'node_cpu_utilization',
      'node_jvm_mem_percent',
      'node_load_average',
      'node_free_space'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers.fatalError(err);
  });
}

uiRoutes.when('/nodes', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'plugins/monitoring/directives' ]);
uiModule.controller('nodes', ($route, timefilter, globalState, title, Private, $executor, $http, monitoringClusters, $scope) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, 'Elasticsearch - Nodes');

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, Private),
    handleResponse: (response) => $scope.pageData = response
  });

  $executor.register({
    execute: () => monitoringClusters(),
    handleResponse: setClusters
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);

});
