/*
 * Kibana Instance
 */
const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [
  'monitoring/directives'
]);

function getPageData(timefilter, globalState, $http, $route, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/kibana/${$route.current.params.uuid}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      {
        name: 'kibana_os_load',
        keys: [
          'kibana_os_load_1m',
          'kibana_os_load_5m',
          'kibana_os_load_15m'
        ]
      },
      'kibana_average_concurrent_connections',
      'kibana_process_delay',
      'kibana_memory_size',
      {
        name: 'kibana_response_times',
        keys: [
          'kibana_max_response_times',
          'kibana_average_response_times'
        ]
      },
      'kibana_requests'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return ajaxErrorHandlers.fatalError(err);
  });
}

require('ui/routes')
.when('/kibana/:uuid', {
  template: require('plugins/monitoring/views/kibana/instance/kibana_template.html'),
  resolve: {
    clusters(Private) {
      var routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

mod.controller('kibana', ($route, globalState, title, Private, $executor, $http, timefilter, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, `Kibana - ${$scope.pageData.kibanaSummary.name}`);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, $route, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
