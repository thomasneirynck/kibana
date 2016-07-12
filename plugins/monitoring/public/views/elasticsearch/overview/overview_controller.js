/**
 * Controller for Overview Page
 */
import _ from 'lodash';
import uiRoutes from'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handlers';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/elasticsearch/overview/overview_template.html';

function getPageData(timefilter, globalState, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      'cluster_search_request_rate',
      'cluster_query_latency',
      {
        name: 'cluster_index_request_rate',
        keys: [
          'cluster_index_request_rate_total',
          'cluster_index_request_rate_primary'
        ]
      },
      'cluster_index_latency'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers.fatalError(err);
  });
}

uiRoutes.when('/elasticsearch', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const mod = uiModules.get('monitoring', [ 'monitoring/directives' ]);
mod.controller('elasticsearch-overview', (
  $route, globalState, timefilter, $http, title, Private, $executor, monitoringClusters, $scope
) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, 'Elasticsearch');

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

