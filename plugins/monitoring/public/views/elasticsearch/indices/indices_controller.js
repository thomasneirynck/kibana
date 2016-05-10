/**
 * Controller for Index Listing
 */
const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [ 'monitoring/directives' ]);

function getPageData(timefilter, globalState, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/indices`;
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
    ],
    listingMetrics: [
      'index_document_count',
      'index_size',
      'index_search_request_rate',
      'index_request_rate_primary'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return ajaxErrorHandlers.fatalError(err);
  });
}

require('ui/routes')
.when('/indices', {
  template: require('plugins/monitoring/views/elasticsearch/indices/indices_template.html'),
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

mod.controller('indices', ($route, globalState, timefilter, $http, title, Private, $executor, monitoringClusters, $scope) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  title($scope.cluster, 'Elasticsearch - Indices');
  $scope.pageData = $route.current.locals.pageData;

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
