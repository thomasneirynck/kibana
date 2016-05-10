/**
 * Controller for Node Detail
 */
const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [ 'plugins/monitoring/directives' ]);

function getPageData(timefilter, globalState, $route, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/nodes/${$route.current.params.node}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      {
        name: 'node_latency',
        keys: [
          'node_query_latency',
          'node_index_latency'
        ]
      },
      'node_jvm_mem_percent',
      {
        name: 'node_mem',
        keys: [ 'node_index_mem_overall' ],
        config: 'xpack.monitoring.chart.elasticsearch.node.index_memory'
      },
      'node_cpu_utilization',
      'node_load_average',
      'node_segment_count'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return ajaxErrorHandlers.fatalError(err);
  });
}

require('ui/routes')
.when('/nodes/:node', {
  template: require('plugins/monitoring/views/elasticsearch/node/node_template.html'),
  resolve: {
    clusters: function (Private) {
      var routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

mod.controller('nodeView', (timefilter, $route, globalState, title, Private, $executor, $http, monitoringClusters, $scope) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, `Elasticsearch - Nodes - ${$scope.pageData.nodeSummary.name}`);

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
