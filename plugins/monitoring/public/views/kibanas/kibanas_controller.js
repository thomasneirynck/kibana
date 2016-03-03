const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [
  'monitoring/directives'
]);

function getPageData(timefilter, $http, Private) {
  const url = `../api/monitoring/v1/kibana`;
  const timeBounds = timefilter.getBounds();

  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    }
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return ajaxErrorHandlers.fatalError(err);
  });
}

require('ui/routes')
.when('/kibana', {
  template: require('plugins/monitoring/views/kibanas/kibanas_template.html'),
  resolve: {
    monitoring(Private) {
      var routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

mod.controller('kibanas', ($route, globalState, Private, $executor, $http, timefilter, $scope) => {
  const docTitle = Private(require('ui/doc_title'));
  docTitle.change('Monitoring', true);
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster });
  }
  $scope.pageData = $route.current.locals.pageData;
  setClusters($route.current.locals.monitoring.clusters);

  $executor.register({
    execute: () => getPageData(timefilter, $http, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
