/**
 * Controller for single index detail
 */
const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', []);

require('ui/routes')
.when('/indices/:index', {
  template: require('plugins/monitoring/views/index/index_template.html'),
  resolve: {
    monitoring: function (Private) {
      const routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

function getPageData(timefilter, globalState, $route, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster}/indices/${$route.current.params.index}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      'index_search_request_rate',
      'index_request_rate',
      'index_size',
      'index_lucene_memory',
      'index_document_count',
      'index_fielddata'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return ajaxErrorHandlers.fatalError(err);
  });
}

mod.controller('indexView', (timefilter, $route, Private, globalState, $executor, $http, monitoringClusters, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster });
  }
  setClusters($route.current.locals.monitoring.clusters);

  $scope.pageData = $route.current.locals.pageData;
  $scope.indexName = $route.current.params.index;

  var docTitle = Private(require('ui/doc_title'));
  docTitle.change(`Monitoring - ${$scope.indexName}`, true);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $route, $http, Private),
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
