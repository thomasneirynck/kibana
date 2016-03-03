const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [
  'monitoring/directives'
]);

function getPageData(timefilter, $http, $route, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/kibana/${$route.current.params.uuid}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      'kibana_os_load_1m$kibana_os_load_5m$kibana_os_load_15m',
      'kibana_average_concurrent_connections',
      'kibana_process_delay',
      'kibana_heap_used$kibana_heap_total',
      'kibana_average_response_times$kibana_max_response_times',
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
  template: require('plugins/monitoring/views/kibana/kibana_template.html'),
  resolve: {
    monitoring(Private) {
      var routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

mod.controller('kibana', ($route, globalState, Private, $executor, $http, timefilter, $scope) => {
  const docTitle = Private(require('ui/doc_title'));
  docTitle.change('Monitoring', true);
  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster });
  }
  setClusters($route.current.locals.monitoring.clusters);
  timefilter.enabled = true;
  $scope.pageData = $route.current.locals.pageData;

  $executor.register({
    execute: () => getPageData(timefilter, $http, $route, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
